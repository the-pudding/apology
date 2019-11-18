library(dplyr)
library(tidyr)
library(gridExtra)
library(jsonlite)
library(rvest)
library(ggplot2)
library(lubridate)
library(ggrepel)
library(directlabels)
library(tidytext)
library(zoo)

##################### Read in data #########################
# Import apologies metadata
meta <- read.csv('data/apologies_meta.csv') %>%
  mutate(
    Data.Variable.ID = paste0('id_', Data.Variable.ID),
    Name = as.character(Name),
    Apology.Date = parse_date_time(Apology.Date, orders = 'b! d!, Y!'),
    Controversy.Date = parse_date_time(Controversy.Date, orders = 'b! d!, Y!'),
    Likes.Dislikes.Views = as.character(Likes.Dislikes.Views)
  ) %>%
  rename(id = Data.Variable.ID) %>%
  filter(Remove.Flag == FALSE) %>%
  select(-Remove.Flag, -X)

# Read in the JSON subscriber and view data and convert to
# listed data frame structure
subview_list <- read_json('data/compiled_subview_data.json') %>%
  lapply(., function(item) {
    sub_df <- bind_rows(item$data$dailySubs) %>%
      full_join(bind_rows(item$data$totalSubs), by = "date") %>%
      mutate(
        date = as.POSIXct(date),
        value.x = as.double(value.x),
        value.y = as.double(value.y)
      ) %>%
      rename(daily = value.x,
             total = value.y) %>%
      filter(date < "2019-09-16")
    
    view_df <- bind_rows(item$data$dailyViews) %>%
      full_join(bind_rows(item$data$totalViews), by = "date") %>%
      mutate(
        date = as.POSIXct(date),
        value.x = as.double(value.x),
        value.y = as.double(value.y)
      ) %>%
      rename(daily = value.x,
             total = value.y) %>%
      filter(date < "2019-09-16")
    
    return(list(subscriptions = sub_df, views = view_df))
  })

################## Clustering ######################

mykmeans <- function(X, k, quality = FALSE, maxiters = 25) {
  n = dim(X)[1]
  p = dim(X)[2]
  X = scale(X)
  min_qual = Inf
  for (a in 1:300) {
    i = 0
    group_old = sample(k, n, replace = TRUE)
    group_new = sample(k, n, replace = TRUE)
    while (!identical(group_old, group_new)) {
      i = i + 1
      group_old = group_new
      centroids = lapply(1:k, function(index) {
        if (is.null(nrow(X[group_old == index, ])))
          centroids[[index]]
        else
          apply(X[group_old == index, ], 2, function(x) mean(x, na.rm=TRUE))
      })
      group_new = apply(X, 1, function(row) {
        which.min(sapply(centroids, function(c) {
          sqrt(sum((c - row) ^ 2, na.rm = TRUE))
        }))
      })
      if(length(unique(group_new)) == 1 || i > maxiters){
        group_new = sample(k, n, replace = TRUE)
        break
      } 
    }
    qual = sum(sapply(1:n, function(i) {
      sqrt(sum((centroids[[group_new[i]]] - X[i, ]) ^ 2, na.rm = TRUE))
    }))
    min_qual = min(qual, min_qual)
    if (min_qual == qual) {
      group_out = group_new
    }
    print(paste0(a, ' iteration had quality: ', qual))
  }
  if (quality)
    return(list(cluster = group_out, quality = min_qual))
  return(group_out)
}


#Fix weird issue with Tana's subs
subview_list[[paste0('id_',33)]]$subscriptions$total[501] = mean(subview_list[[paste0('id_',33)]]$subscriptions$total[500], subview_list[[paste0('id_',33)]]$subscriptions$total[502])
pre_apology_classification_data <- lapply(1:37, function(i) {
  sub_df <- subview_list[[i]][[1]]
  controversy_date <- meta$Controversy.Date[i]
  maxcount_ba <- filter(sub_df, date < controversy_date) %>%
    summarise(max(total)) %>% as.double
  sub_df <- sub_df %>%
    filter(date < controversy_date) %>%
    filter(floor((controversy_date-date)/24) < 90) %>%
    mutate(total = total / maxcount_ba,
           days = as.integer(ceiling((controversy_date-date)/24))) %>%
    mutate(id = gsub("\\D", "", meta$id[i]))
  return(sub_df)
}) %>%
  bind_rows() %>%
  filter(!is.na(total) & total != 0 & id != "7" & id != "11" & id != "23" & id != "27" & id != "32"& id != "29") %>%
  select(-daily,-date) %>%
  mutate(id = as.factor(id)) %>%
  spread(., id, total) %>%
  select(-days) %>%
  t

pregroups <- mykmeans(pre_apology_classification_data, 7, quality = TRUE)


# pre_apology_classification_data %>%
#   t %>%
#   as.data.frame() %>%
#   mutate(days = 1:nrow(.)) %>%
#   gather(id, value, -days) %>%
#   mutate(cluster = pregroups[[1]][paste0(id)]) %>% write.csv("data/pre_apology_plot_data.csv")

pre_apology_classification_data %>%
  t %>%
  as.data.frame() %>%
  mutate(days = 1:nrow(.)) %>%
  gather(id, value, -days) %>%
  mutate(group = pregroups[[1]][paste0(id)],
         name = meta$Name[as.integer(id)]) %>%
  group_by(id) %>%
  mutate(name = if_else(days == sample(days, 1), name, NA_character_)) %>%
  ggplot(aes(
    x = desc(days),
    y = value,
    color = id,
    label = name
  )) +
  geom_line() +
  facet_grid(. ~ group) +
  geom_label_repel(
    aes(label = name),
    alpha = 0.8,
    nudge_y = -0.3,
    direction = "y",
    angle = 90,
    hjust = 0.5,
    na.rm = TRUE
  ) +
  theme_bw() +
  scale_colour_discrete(guide = 'none') +
  xlab('Days to controversy') +
  ylab('Subs compared to pre-apology max')



post_apology_classification_data <- lapply(1:37, function(i) {
  sub_df <- subview_list[[i]][[1]]
  apology_date <- meta$Apology.Date[i]
  maxcount_ba <- filter(sub_df, date < apology_date) %>%
    summarise(max(total)) %>% as.double
  sub_df <- sub_df %>%
    filter(date >= apology_date) %>%
    mutate(total = total / maxcount_ba,
           days = as.integer(floor((date - apology_date)/24))) %>%
    mutate(id = gsub("\\D", "", meta$id[i]))
  return(sub_df)
}) %>%
  bind_rows() %>%
  filter(days < 180) %>%
  filter(!is.na(total) & total != 0 & id != "7" & id != "11" & id != "23" & id != "27" & id != "32" & id != "29") %>%
  select(-daily,-date) %>%
  mutate(id = as.factor(id)) %>%
  spread(., id, total) %>%
  select(-days) %>%
  t

postgroups <- mykmeans(post_apology_classification_data, 7, quality = TRUE)


# post_apology_classification_data %>%
#   t %>%
#   as.data.frame() %>%
#   mutate(days = 0:(nrow(.)-1)) %>%
#   gather(id, value, -days) %>%
#   filter(!is.na(value)) %>%
#   mutate(cluster = postgroups[[1]][paste0(id)]) %>% write.csv("data/post_apology_180_plot_data.csv")

#pdf(file = 'plots/post_apology_classification.pdf', width = 14, height = 5)
post_apology_classification_data %>%
  t %>%
  as.data.frame() %>%
  mutate(days = 0:(nrow(.)-1)) %>%
  gather(id, value, -days) %>%
  filter(!is.na(value)) %>%
  mutate(group = postgroups[[1]][paste0(id)],
         name = meta$Name[as.integer(id)]) %>%
  group_by(id) %>%
  mutate(name = if_else(days == sample(days, 1), name, NA_character_)) %>%
  ggplot(aes(
    x = days,
    y = value,
    color = id,
    label = name
  )) +
  geom_line() +
  facet_grid(. ~ group) +
  geom_label_repel(
    aes(label = name),
    nudge_y = 1,
    direction = "y",
    angle = 90,
    hjust = 0.5,
    na.rm = TRUE
  ) +
  theme_bw() +
  scale_colour_discrete(guide = 'none') +
  xlab('Days since apology') +
  ylab('Subs compared to pre-apology max')

#dev.off()




################## Subscription and view data ##########################

addPvalue <- function(df, testwidth = 30) {
  range = (testwidth + 1):length(df$daily)
  df$pval[(testwidth + 1):length(df$daily)] <-
    sapply(range, function(i) {
      a <- density(df$daily[(i - testwidth):(i - 1)])
      return(sum(a$y[a$x < df$daily[i]]) / sum(a$y))
    })
  return(df)
}


create_plot <- function(id, days_for_avg = 30) {
  df <- subview_list[[id]]
  sub_df <- df[[1]] %>% addPvalue() %>%
    mutate(color = ifelse(pval < 0.05, 'red', ifelse(pval > 0.95, 'blue', 'black'))) %>%
    mutate(color = ifelse(is.na(color), 'black', color)) %>% 
    mutate(avg = rollapply(daily, days_for_avg, mean, align = 'right', fill = NA))
  view_df <- df[[2]] %>% addPvalue() %>%
    mutate(color = ifelse(pval < 0.05, 'red', ifelse(pval > 0.95, 'blue', 'black'))) %>%
    mutate(color = ifelse(is.na(color), 'black', color)) %>% 
    mutate(avg = rollapply(daily, days_for_avg, mean, align = 'right', fill = NA))

  p1 <- ggplot(data = sub_df, aes(x = date, y = total)) +
    geom_line() +
    geom_hline(yintercept = 0) +
    geom_vline(xintercept = meta$Apology.Date.s[id],
               linetype = 2) +
    scale_x_datetime(date_breaks = '4 month', date_labels = '%b %y') +
    ggtitle('', subtitle = 'Total Subscriber Count') +
    theme_bw() +
    theme(
      axis.title.x = element_blank(),
      axis.title.y = element_blank(),
      plot.title = element_blank(),
      axis.text.x = element_text(
        size = 8,
        angle = 45,
        hjust = 1
      )
    )
  
  p2 <- ggplot(data = sub_df, aes(x = date, y = daily)) +
    geom_bar(stat = 'identity', aes(fill = color), alpha = 0.4) +
    geom_line(aes(y = avg)) +
    geom_hline(yintercept = 0) +
    geom_vline(xintercept = meta$Apology.Date.s[id],
               linetype = 2)  +
    scale_x_datetime(date_breaks = '4 month', date_labels = '%b %y') +
    scale_fill_manual(values = c('grey', 'blue', 'red')) +
    ggtitle('', subtitle = 'Change in Subscriber Count') +
    theme_bw() +
    theme(
      axis.title.x = element_blank(),
      axis.title.y = element_blank(),
      plot.title = element_blank(),
      legend.position = 'none',
      axis.text.x = element_text(
        size = 8,
        angle = 45,
        hjust = 1
      )
    )
  
  p3 <- ggplot(data = view_df, aes(x = date, y = total)) +
    geom_line() +
    geom_hline(yintercept = 0) +
    geom_vline(xintercept = meta$Apology.Date.s[id],
               linetype = 2)  +
    scale_x_datetime(date_breaks = '4 month', date_labels = '%b %y') +
    ggtitle('', subtitle = 'Total View Count') +
    theme_bw() +
    theme(
      axis.title.x = element_blank(),
      axis.title.y = element_blank(),
      plot.title = element_blank(),
      axis.text.x = element_text(
        size = 8,
        angle = 45,
        hjust = 1
      )
    )
  
  p4 <- ggplot(data = view_df, aes(x = date, y = daily)) +
    geom_bar(stat = 'identity', aes(fill = color), alpha = 0.4) +
    geom_line(aes(y = avg)) +
    geom_hline(yintercept = 0) +
    geom_vline(xintercept = meta$Apology.Date.s[id],
               linetype = 2) +
    scale_x_datetime(date_breaks = '4 month', date_labels = '%b %y') +
    scale_fill_manual(values = c('grey', 'blue', 'red')) +
    ggtitle('', subtitle = 'Change in View Count') +
    theme_bw() +
    theme(
      axis.title.x = element_blank(),
      axis.title.y = element_blank(),
      plot.title = element_blank(),
      legend.position = 'none',
      axis.text.x = element_text(
        size = 8,
        angle = 45,
        hjust = 1
      )
    )
  
  p2 <-
    p2 + coord_cartesian(ylim = quantile(sub_df$daily, c(0.01, 0.99), na.rm = TRUE))
  p4 <-
    p4 + coord_cartesian(ylim = quantile(view_df$daily, c(0.01, 0.99), na.rm = TRUE))
  
  grid.arrange(
    grobs = list(p1, p2, p3, p4),
    top = paste(meta$Name[id], 'Subscriber and View Data')
  )
}

## Save the statistics plots
# for (i in 1:37) {
#     filename = paste0('plots/', gsub('\\s', '_', meta$Name[i]), '_statplot.pdf')
#     pdf(file = filename, width = 7, height = 5)
#     create_plot(i)
#     dev.off()
#     print(filename)
# }


################## Likes, dislikes and views ########################

get_stats <-
  function(id, api_key = 'AIzaSyBvPE49eyTfHp42SMHcAiebOOJiC6Va9AU') {
    if (is.character(id)) video_id <- id
    else video_id <- gsub('^.*v=', '', meta$Video.Link[id])
    request <-
      paste0(
        'https://www.googleapis.com/youtube/v3/videos?id=',
        video_id,
        '&part=statistics&key=',
        api_key
      )
    stats <- read_html(request) %>% html_text() %>% parse_json()
    return(list(
      views = as.double(stats$items[[1]]$statistics$viewCount),
      likes = as.double(stats$items[[1]]$statistics$likeCount),
      dislikes = as.double(stats$items[[1]]$statistics$dislikeCount)
    ))
  }

get_stats_history <- function(index, api_key = 'AIzaSyBvPE49eyTfHp42SMHcAiebOOJiC6Va9AU'){
  request <- paste0(
    'https://www.googleapis.com/youtube/v3/search?key=',
    api_key,
    '&channelId=',
    meta$Channel.ID[index],
    '&part=snippet,id&type=video&publishedBefore=',
    meta$Apology.Date[index],
    'T00:00:00Z&order=date&maxResults=10'
  )
  returnval <- read_html(request) %>% html_text %>% parse_json
  lapply(returnval$items, function(item){
    stats <- get_stats(item$id$videoId)
    return(data.frame(date = as.POSIXct(item$snippet$publishedAt),
                      views = stats$views,
                      likes = stats$likes,
                      dislikes = stats$dislikes))
  }) %>%
    bind_rows() %>%
    return()
}

create_stats_plot <- function(index, save=FALSE) {
  p <- get_stats_history(index) %>% bind_rows(data.frame(date = meta$Apology.Date[index],
                                                views = as.numeric(strsplit(as.character(meta$Likes.Dislikes.Views[index]), split = '/')[[1]][3]),
                                                likes = as.numeric(strsplit(as.character(meta$Likes.Dislikes.Views[index]), split = '/')[[1]][1]),
                                                dislikes = as.numeric(strsplit(as.character(meta$Likes.Dislikes.Views[index]), split = '/')[[1]][2]))) %>%
    gather(type, count, likes, dislikes) %>%  
    ggplot(aes(date)) +
    geom_bar(aes(weight = count, fill = type)) +
    geom_vline(xintercept = meta$Apology.Date[index], lty = 2) +
    geom_vline(xintercept = meta$Controversy.Date[index], lty = 2) +
    theme_bw() +
    ggtitle(paste0(meta$Name[index], ' like and dislike trend'))
  
  if (save) {
    pdf(file = paste0('plots/stats/', gsub('\\s', '_', meta$Name[index]), '_likedislikeplot.pdf'), width = 7, height = 5)
    print(p)
    dev.off()
  }
  return(p)
}

create_stats_plot(14, TRUE)




for(i in 17:37) {
  a <- get_stats(i)$channelID
  print(a)
}

stats_df <- lapply(1:37, function(i){
  if(meta$Original.Available[i]){
    index = as.integer(gsub('\\D', '', meta$id[i]))
    return(list(id = meta$id[i],
                name = meta$Name[i],
                likes = ifelse(length(stats_list[[index]]$likes) == 0, NA, stats_list[[index]]$likes),
                dislikes = ifelse(length(stats_list[[index]]$dislikes) == 0, NA, stats_list[[index]]$dislikes),
                views = stats_list[[index]]$views))
  }
  return(NULL)
}) 

stats_df <- stats_df[lengths(stats_df) != 0] %>% bind_rows %>% mutate(combined = paste0(likes,'/',dislikes,'/',views))

p1 <- stats_df %>%
  gather(type, count, likes, dislikes) %>%
  ggplot(aes(x = name, fill = type)) +
  geom_bar(aes(weight = count)) + 
  theme_bw() +
  theme(axis.title.x = element_blank(),
        axis.text.x = element_text(
          size = 8,
          angle = 45,
          hjust = 1
        )) + 
  ylab('likes and dislikes')

p2 <- stats_df %>%
  select(name, views) %>%
  ggplot(aes(x = name)) +
  geom_bar(aes(weight = views)) +
  theme_bw() +
  theme(axis.title.x = element_blank(),
        axis.text.x = element_text(
          size = 8,
          angle = 45,
          hjust = 1
        )) +
  ylab('video views')

#pdf(file = 'plots/video_stats.pdf', width = 7, height = 5)
grid.arrange(
  grobs = list(p1, p2),
  top = paste('Video Stats')
)
#dev.off()

################### Comment Sentiment Analysis ##########################

get_comments <-
  function(id, api_key = 'AIzaSyBvPE49eyTfHp42SMHcAiebOOJiC6Va9AU') {
    commentlist <- list()
    video_id <- gsub('^.*v=', '', meta$Video.Link.s[id])
    nextPageToken = ''
    
    while (!is.null(nextPageToken)) {
      request <-
        paste0(
          'https://www.googleapis.com/youtube/v3/commentThreads?key=',
          api_key,
          '&textFormat=plainText&part=snippet&videoId=',
          video_id,
          '&maxResults=100&pageToken=',
          nextPageToken
        )
      
      comments <- read_html(request) %>% html_text() %>% parse_json()
      nextPageToken <- comments$nextPageToken
      commentlist <-
        append(commentlist, comments$items %>% lapply(function(item) {
          return(
            list(
              date = as.POSIXct(item$snippe$topLevelComment$snippet$publishedAt),
              text = item$snippet$topLevelComment$snippet$textOriginal
            )
          )
        }))
    }
    return(commentlist)
  }

calculate_sentiment <- function(comment_list) {
  sentiment_df <- bind_rows(comment_list) %>%
    unnest_tokens(word, text) %>%
    inner_join(get_sentiments("bing"), by = "word") %>%
    mutate(sentiment = ifelse(sentiment == "positive", 1,-1)) %>%
    group_by(date) %>%
    summarise(sentiment = mean(sentiment),
              num = n())
  
  return(sentiment_df)
}

for (i in 27:37) {
  if (meta$Original.Available[i]) {
    if (!file.exists(paste0('data/Comments/', gsub('\\s', '_', meta$Name[i]), '_comments.RData'))) {
      comments <- get_comments(i)
      save(comments, file = paste0('data/Comments/', gsub('\\s', '_', meta$Name[i]), '_comments.RData'))
    } else{
      load(paste0('data/Comments/', gsub('\\s', '_', meta$Name[i]), '_comments.RData'))
    }
    sent_df <- calculate_sentiment(comments)
    p1 <- ggplot(filter(sent_df, date < "2019-09-16"), aes(x = date, y = sentiment)) +
      geom_point() +
      geom_smooth() +
      theme_bw()
    
    p2 <- ggplot(filter(sent_df, date < "2019-09-16"), aes(x = date, y = sentiment*num)) +
      geom_line() +
      theme_bw()
    
    #pdf(file = paste0('plots/', gsub('\\s', '_', meta$Name[i]), '_commentplot.pdf'), width = 7, height = 5)
    grid.arrange(
      grobs = list(p1, p2),
      top = paste(meta$Name[i], 'Comment Sentiments')
    )
    #dev.off()
  }
}

#######










