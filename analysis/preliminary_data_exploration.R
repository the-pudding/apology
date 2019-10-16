library(dplyr)
library(rvest)
library(ggplot2)
library(gridExtra)
library(topicmodels)
library(tm)
library(tidytext)
library(jsonlite)

# List that contains some examples and relevant information
example_data <- list(
  list(
    name = 'Pewdiepie',
    url = 'https://socialblade.com/youtube/user/pewdiepie/monthly/',
    incidents = c(as.POSIXct('2017-09-12')),
    apology = 'https://www.youtube.com/watch?v=cLdxuaxaQwc'
    ),
  list(
    name = 'Logan Paul',
    url = 'https://socialblade.com/youtube/channel/UCG8rbF3g2AMX70yOd8vqIZg/monthly/',
    incidents = c(as.POSIXct('2018-01-02')),
    apology = 'https://www.youtube.com/watch?v=QwZT7T-TXT0'
  ),
  list(
    name = 'Jaclyn Hill',
    url = 'https://socialblade.com/youtube/user/jaclynhill1/monthly/',
    incidents = c(as.POSIXct('2019-06-12')),
    apology = 'https://www.youtube.com/watch?v=x8QeSZpr0bs'
  ),
  list(
    name = 'James Charles',
    url = 'https://socialblade.com/youtube/channel/UCucot-Zp428OwkyRm2I7v2Q/monthly/',
    incidents = c(as.POSIXct('2019-05-18')),
    apology = 'https://www.youtube.com/watch?v=uFvtCUzfyL4'
  ),
  list(
    name = 'ProJared',
    url = 'https://socialblade.com/youtube/c/projared/monthly/',
    incidents = c(as.POSIXct('2019-05-09')),
    apology = 'https://www.youtube.com/watch?v=BBywRBbDUjA'
  ),
  list(
    name = 'RiceGum',
    url = 'https://socialblade.com/youtube/user/ricegum/monthly/',
    incidents = c(as.POSIXct('2019-01-02')),
    apology = 'https://www.youtube.com/watch?v=4E8qmF10Mts'
  ),
  list(
    name = 'Tana Mongeau',
    url = 'https://socialblade.com/youtube/channel/UClWD8su9Sk6GzZDwy9zs3_w/monthly/',
    incidents = c(as.POSIXct('2017-02-06'), as.POSIXct('2018-06-22')),
    apology = 'https://www.youtube.com/watch?v=bOR8c2z3sSk'
  ),
  list(
    name = 'JoJo Siwa',
    url = 'https://socialblade.com/youtube/channel/UCeV2O_6QmFaaKBZHY3bJgsA/monthly/',
    incidents = c(as.POSIXct('2019-06-15')),
    apology = 'https://www.youtube.com/watch?v=6OMbgiUEFv0'
  ),
  list(
    name = 'Laura Lee',
    url = 'https://socialblade.com/youtube/user/laura88lee/monthly/',
    incidents = c(as.POSIXct('2018-08-20')),
    apology = 'https://www.youtube.com/watch?v=9uNpjj9tuoE'
  ),
  list(
    name = 'Alfie Deyes',
    url = 'https://socialblade.com/youtube/user/pointlessblogtv/monthly/',
    incidents = c(as.POSIXct('2018-06-18')),
    apology = 'https://www.youtube.com/watch?v=GLLwNBG1ang'
  ),
  list(
    name = 'Jason Nash',
    url = 'https://socialblade.com/youtube/user/jasonnashcomedy/monthly/',
    incidents = c(as.POSIXct('2018-06-22')),
    apology = 'https://www.youtube.com/watch?v=HldIhyhraOc'
  ),
  list(
    name = 'Gabriel Zamora',
    url = 'https://socialblade.com/youtube/channel/UCSWENbKZYBT6FkPlQvWbrtA/monthly/',
    incidents = c(as.POSIXct('2018-08-21')),
    apology = 'https://www.youtube.com/watch?v=QWnmPEHzRrk'
  ),
  list(
    name = 'Jefree Star',
    url = 'https://socialblade.com/youtube/user/jeffreestar/monthly/',
    incidents = c(as.POSIXct('2017-06-20')),
    apology = 'https://www.youtube.com/watch?v=Su6FeI7lHVg'
  ),
  list(
    name = 'Social Response',
    url = 'https://socialblade.com/youtube/user/socialreposemusic/monthly/',
    incidents = c(as.POSIXct('2017-11-05')),
    apology = 'https://www.youtube.com/watch?v=rOaa3X0b_kQ'
  ),
  list(
    name = 'Jake Paul',
    url = 'https://socialblade.com/youtube/user/jakepaulproductions/monthly/',
    incidents = c(as.POSIXct('2015-06-03')) # Not Real
  )
)



# Function reads weekly subscriber and view count data from Social Blade
readData <- function(inurl){
  con <- url(inurl, 'rb')
  scripts <- read_html(con) %>% html_nodes('script[type = \'text/javascript\']') 
  script <- html_text(scripts[[6]]) %>% strsplit(., split = '\n') %>% unlist
  subChartInd <- grep('graph-youtube-daily-weekly-subscribers-container', script)
  viewChartInd <- grep('graph-youtube-daily-weekly-vidviews-container', script)
  dataInd <- grep('series:', script)
  
  subdf <- script[first(dataInd[subChartInd < dataInd])] %>%
    gsub('.*data: \\[\\[', '', .) %>%
    gsub('\\]\\] \\}\\],', '', .) %>%
    strsplit(., split = '\\]\\,\\[') %>%
    unlist %>%
    lapply(., function(term){
      items = strsplit(term, split = ',')[[1]]
      count = as.double(items[2])
      date = as.POSIXct(as.numeric(items[1])/1000, origin = '1970-01-01')
      return(data.frame(date = date, count = count))
    }) %>%
    bind_rows() %>%
    arrange(date) %>%
    mutate(nextcount = lead(count)) %>%
    #mutate(change = nextcount-count)
    mutate(change = 100*(nextcount/count - 1))
  
  viewdf <- script[first(dataInd[viewChartInd < dataInd])] %>%
    gsub('.*data: \\[\\[', '', .) %>%
    gsub('\\]\\] \\}\\],', '', .) %>%
    strsplit(., split = '\\]\\,\\[') %>%
    unlist %>%
    lapply(., function(term){
      items = strsplit(term, split = ',')[[1]]
      count = as.double(items[2])
      date = as.POSIXct(as.numeric(items[1])/1000, origin = '1970-01-01')
      return(data.frame(date = date, count = count))
    }) %>%
    bind_rows() %>%
    arrange(date) %>%
    mutate(nextcount = lead(count)) %>%
    #mutate(change = nextcount-count)
    mutate(change = 100*(nextcount/count - 1))
  
  return(list(subdf, viewdf))
}

addPvalue <- function(df, testwidth = 15){
  range = (testwidth + 1):length(df$change)
  df$pval[(testwidth + 1):length(df$change)] <- sapply(range, function(i){
    a <- density(df$change[(i - testwidth):(i - 1)])
    return(sum(a$y[a$x < df$change[i]])/sum(a$y))
  })
  return(df)
}

# Use data read from Social Blade to construct plots of total counts
# and changes over time
plotData <- function(index){
  df <- readData(example_data[[index]]['url'][[1]])
  sub_df <- df[[1]] %>% addPvalue() %>% 
    mutate(color = ifelse(pval < 0.05, 'red', ifelse(pval > 0.95, 'blue', 'black'))) %>%
    mutate(color = ifelse(is.na(color), 'black', color))
  view_df <- df[[2]] %>% addPvalue() %>% 
    mutate(color = ifelse(pval < 0.05, 'red', ifelse(pval > 0.95, 'blue', 'black'))) %>%
    mutate(color = ifelse(is.na(color), 'black', color))
  
  p1 <- ggplot(data = sub_df, aes(x = date, y = count)) + 
    geom_line() +
    geom_hline(yintercept = 0) +
    geom_vline(xintercept = example_data[[index]]['incidents'][[1]], linetype = 2) +
    scale_x_datetime(date_breaks = '4 month', date_labels = '%b %y') +
    ggtitle('', subtitle = 'Total Subscriber Count') +
    theme_bw() +
    theme(axis.title.x = element_blank(), axis.title.y = element_blank(),
          plot.title = element_blank(), axis.text.x = element_text(size = 8, angle = 45, hjust = 1))
  
  p2 <- ggplot(data = sub_df[-nrow(sub_df),], aes(x = date, y = change, fill = color)) +
    geom_bar(stat = 'identity') +
    geom_hline(yintercept = 0) +
    geom_vline(xintercept = example_data[[index]]['incidents'][[1]], linetype = 2)  +
    scale_x_datetime(date_breaks = '4 month', date_labels = '%b %y') +
    scale_fill_manual(values = c('grey', 'blue', 'red')) +
    ggtitle('', subtitle = 'Percent Change in Subscriber Count') +
    theme_bw() +
    theme(axis.title.x = element_blank(), axis.title.y = element_blank(), 
          plot.title = element_blank(), legend.position = 'none',
          axis.text.x = element_text(size = 8, angle = 45, hjust = 1))
  
  p3 <- ggplot(data = view_df, aes(x = date, y = count)) + 
    geom_line() +
    geom_hline(yintercept = 0) +
    geom_vline(xintercept = example_data[[index]]['incidents'][[1]], linetype = 2)  +
    scale_x_datetime(date_breaks = '4 month', date_labels = '%b %y') +
    ggtitle('', subtitle = 'Total View Count') +
    theme_bw() +
    theme(axis.title.x = element_blank(), axis.title.y = element_blank(),
          plot.title = element_blank(), axis.text.x = element_text(size = 8, angle = 45, hjust = 1))
  
  p4 <- ggplot(data = view_df[-nrow(sub_df),], aes(x = date, y = change, fill = color)) +
    geom_bar(stat = 'identity') +
    geom_hline(yintercept = 0) +
    geom_vline(xintercept = example_data[[index]]['incidents'][[1]], linetype = 2) +
    scale_x_datetime(date_breaks = '4 month', date_labels = '%b %y') +
    scale_fill_manual(values = c('grey', 'blue', 'red')) +
    ggtitle('', subtitle = 'Percent Change in View Count') +
    theme_bw() +
    theme(axis.title.x = element_blank(), axis.title.y = element_blank(),
          plot.title = element_blank(), legend.position = 'none',
          axis.text.x = element_text(size = 8, angle = 45, hjust = 1))
  
  if (any(sub_df$change > 5, na.rm = TRUE)) p2 <- p2 + coord_cartesian(ylim = c(-1, 5))
  if (any(view_df$change > 5, na.rm = TRUE)) p4 <- p4 + coord_cartesian(ylim = c(-1, 5))
  
  grid.arrange(grobs = list(p1, p2, p3, p4), top = paste(example_data[[index]]['name'][[1]], 'Subscriber and View Data'))
}

plotData(15)


######################## Apology transcript analysis (incomplete) #####################################

# NOTE: need to install youtube-dl in terminal before running this code

# Generates transcripts from youtube video 
generateTranscript <- function(index){
  filename = gsub(' ', '', example_data[[index]]['name'][[1]])
  if (!file.exists(paste0('Transcripts/', filename, '.en.vtt')))
    system(paste0('youtube-dl --sub-lang en -o Transcripts/', 
                  filename,
                  ' --write-auto-sub --skip-download ', 
                  example_data[[index]]['apology'][[1]]))
  
  transcript <- readLines(paste0('Transcripts/', filename, '.en.vtt'))[-(1:3)] %>%
    gsub('^.*\\d{2}:\\d{2}:\\d{2}.\\d{3} --> \\d{2}:\\d{2}:\\d{2}.\\d{3}.*$', '', .) %>%
    gsub('^.*<c>.*$', '', .) %>%
    unique() %>%
    gsub('  ', '', .) %>%
    paste(., collapse = ' ') %>%
    gsub('  ', '', .)
  
  return(transcript)
}

generateTranscript(5)


# Use LDA to generate topic allocations for apologies 
## Currently does not work well. Need WAYY more data for usable results
transcriptList <- lapply(1:(length(example_data) - 1), generateTranscript)

transcript_freq <- lapply(1:length(transcriptList), function(index){
  tolower(transcriptList[[index]]) %>%
    gsub('[[:punct:]]', '', .) %>%
    strsplit(split = ' ') %>%
    table() %>%
    as.data.frame(row.names = NULL) %>%
    rename(., word = ., freq = Freq) %>%
    mutate(documentID = index) %>%
    mutate(word = as.character(word)) %>%
    mutate(freq = as.numeric(freq)) %>%
    filter(!(word %in% stopwords())) # Remove up to two letter words
}) %>%
  bind_rows()

transcript_tdm <- transcript_freq %>%
  cast_dtm(documentID, word, freq)  

lda <- LDA(transcript_tdm, k = 12)
tidy(lda, matrix = 'gamma') %>%
  ggplot(aes(document, gamma, fill = factor(topic))) +
  geom_bar(stat = 'identity')

tidy(lda, matrix = 'beta') %>%
  group_by(topic) %>%
  top_n(30, beta) %>%
  ungroup() %>%
  ggplot(aes(term, beta, fill = factor(topic))) +
  geom_bar(stat = 'identity') +
  facet_wrap(~topic, nrow = 3) + 
  theme(axis.text.x = element_text(hjust = 1, angle = 90))

tidy(lda, matrix = 'beta') %>%
  group_by(topic) %>%
  top_n(10, beta) %>%
  ungroup() %>%
  arrange(topic, -beta) %>%
  ggplot(aes(term, beta, fill = factor(topic))) +
  geom_col(show.legend = FALSE) + 
  facet_wrap(~topic, scales = 'free') +
  coord_flip() + 
  scale_x_reordered()

a <- transcript_freq %>%
  group_by(documentID) %>%
  arrange(documentID, desc(freq)) %>%
  mutate(total = sum(freq)) %>%
  mutate(proportion = 100*(freq/total))

################ YouTube video comment analysis (incomplete) ##############################
 
api_key = 'AIzaSyBvPE49eyTfHp42SMHcAiebOOJiC6Va9AU'

index <- 1
video_id <- gsub('^.*v=', '', example_data[[index]]['apology'][[1]])
request <- paste0('https://www.googleapis.com/youtube/v3/commentThreads?key=',
                 api_key,
                 '&textFormat=plainText&part=snippet&videoId=',
                 video_id,
                 '&maxResults=10')
comments <- read_html(request)


