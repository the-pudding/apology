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

# Import apologies metadata
meta <- read.csv('data/apologies_meta.csv') %>%
  mutate(
    Data.Variable.ID = paste0('id_', Data.Variable.ID),
    Name = as.character(Name),
    Apology.Date.s = parse_date_time(Apology.Date.s, orders = 'b! d!, Y!')
  ) %>%
  rename(id = Data.Variable.ID)

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



mykmeans <- function(X, k, quality = FALSE) {
  n = dim(X)[1]
  p = dim(X)[2]
  X = scale(X)
  min_qual = Inf
  for (a in 1:100) {
    group_old = sample(k, n, replace = TRUE)
    group_new = sample(k, n, replace = TRUE)
    while (!identical(group_old, group_new)) {
      group_old = group_new
      centroids = lapply(1:k, function(index) {
        if (is.null(nrow(X[group_old == index, ])))
          centroids[[index]]
        else
          apply(X[group_old == index, ], 2, mean)
      })
      group_new = apply(X, 1, function(row) {
        which.min(sapply(centroids, function(c) {
          sqrt(sum((c - row) ^ 2, na.rm = TRUE))
        }))
      })
    }
    qual = sum(sapply(1:n, function(i) {
      sqrt(sum((centroids[[group_new[i]]] - X[i, ]) ^ 2))
    }))
    min_qual = min(qual, min_qual)
    if (min_qual == qual) {
      group_out = group_new
    }
  }
  if (quality)
    return(list(cluster = group_out, quality = min_qual))
  return(group_out)
}



n = 50
classification_data <- lapply(1:44, function(i) {
  sub_df <- subview_list[[i]][[1]]
  apology_date <- meta$Apology.Date.s[i]
  maxcount_ba <- filter(sub_df, date < apology_date) %>%
    summarise(max(total)) %>% as.double
  sub_df <- sub_df %>%
    filter(date >= apology_date) %>%
    mutate(total = total / maxcount_ba)
  samples <- floor(seq(1, nrow(sub_df), length.out = n))
  return(sub_df[samples, ])
}) %>%
  bind_rows(., .id = "id") %>%
  filter(!is.na(total) & total != 0) %>%
  select(-daily,-date) %>%
  mutate(id = as.factor(id),
         num = rep(1:n, 38)) %>%
  spread(., id, total) %>%
  select(-num) %>%
  t

groups <- mykmeans(classification_data, 7)

#pdf(file = 'plots/post_apology_classification.pdf', width = 14, height = 5)
classification_data %>%
  t %>%
  as.data.frame() %>%
  mutate(num = 1:n) %>%
  gather(id, value,-num) %>%
  mutate(group = groups[paste(id)],
         name = meta$Name[as.integer(id)]) %>%
  group_by(id) %>%
  mutate(name = if_else(num == sample(num, 1), name, NA_character_)) %>%
  ggplot(aes(
    x = num,
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
  ylab('Subs compared to pre-apology max')

#dev.off()


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

create_plot(6)


get_stats <-
  function(id, api_key = 'AIzaSyBvPE49eyTfHp42SMHcAiebOOJiC6Va9AU') {
    video_id <- gsub('^.*v=', '', meta$Video.Link.s[id])
    request <-
      paste0(
        'https://www.googleapis.com/youtube/v3/videos?id=',
        video_id,
        '&part=statistics&key=',
        api_key
      )
    stats <- read_html(request) %>% html_text() %>% parse_json()
    if (length(stats$items) == 0)
      return(NULL)
    return(list(
      views = as.double(stats$items[[1]]$statistics$viewCount),
      likes = as.double(stats$items[[1]]$statistics$likeCount),
      dislikes = as.double(stats$items[[1]]$statistics$dislikeCount)
    ))
  }

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


stats_list <- lapply(1:44, function(id) {
  return(get_stats(id))
})

stats_df <- lapply(1:44, function(i){
  if(meta$Original.Available[i] & !meta$Remove.Flag[i]){
    index = as.integer(gsub('\\D', '', meta$id[i]))
    return(list(id = meta$id[i],
                name = meta$Name[i],
                likes = ifelse(length(stats_list[[index]]$likes) == 0, NA, stats_list[[index]]$likes),
                dislikes = ifelse(length(stats_list[[index]]$dislikes) == 0, NA, stats_list[[index]]$dislikes),
                views = stats_list[[index]]$views))
  }
  return(NULL)
}) 

stats_df <- stats_df[lengths(stats_df) != 0] %>% bind_rows

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


for (i in 27:44) {
  if (meta$Original.Available[i] & !meta$Remove.Flag[i]) {
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


## Save the statistics plots
# for (i in 1:44) {
#   if(!meta$Remove.Flag[i]){
#     filename = paste0('plots/', gsub('\\s', '_', meta$Name[i]), '_statplot.pdf')
#     pdf(file = filename, width = 7, height = 5)
#     create_plot(i)
#     dev.off()
#     print(filename)
#   }
# }
