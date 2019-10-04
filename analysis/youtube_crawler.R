library(dplyr)
library(rvest)
library(RSelenium)

# Using selenium because the information seems hard to scrape from the 
# source code. Need to render the full webpage and then extract infromation 
# from the added elements.
driver <- rsDriver(browser = c('chrome'), port = 4571L)
remDr <- driver[['client']]

# Load old list from storage, named youtuber_list
# Ignore if starting from scratch
# load("data/youtuber_list_3.RData")
# old_list <- youtuber_list

# Start by initializing a big list
youtuber_list <- lapply(1:100000, function(i) NULL)
# Fill in values from stored list
# youtuber_list[1:length(old_list)] <- old_list
# Initialize an ID vector that will be used to check for duplicates
ids <- sapply(youtuber_list, function(i) i[[3]])

# Seed channels.
# Can start with a single seed channel manually added at the appropriate location
# in the intialized list
# youtuber_list[[18254]] <- list(
#   name = 'Ozzy Man Reviews',
#   subscribers = convertToNum('3.49M subscribers'),
#   url = '/user/ozzymanreviews'
# )
# Add seed channels from the social blade list that have not yet been found
# youtuber_list[18256:(18256 - 1 + length(sb_list))] <- sb_list

# Helper function to convert text subscriber counts to numeric
convertToNum <- function(textNum) {
  num = as.numeric(gsub('[[:alpha:]]', '', textNum))
  multiplier = gsub('[[:lower:]]', '', textNum) %>%
    gsub('[^[:alpha:]]', '', .)
  if (multiplier == 'M') return(num * 1000000)
  else if (multiplier == 'K') return(num * 1000)
  else return(num)
}

# Iterate over a suitable range
for (i in 1:30000) {
  # Navigate to the featured channels page for the current channel
  seedlink <- paste0(
    'https://www.youtube.com',
    youtuber_list[[i]]$url,
    '/channels?view=59&flow=grid'
  )
  remDr$navigate(seedlink)
  
  # Store the size of potential number of channels
  size <- length(remDr$executeScript(
        'return document.getElementsByTagName("ytd-grid-channel-renderer")'))
  
  # Jump to the next entry in channel list if no potential channels were found
  if (size == 0) next
  
  # Create a list of new channels found
  new_channels <- lapply(1:size, function(i) {
    script <-
      paste0(
        'return document.getElementsByTagName("ytd-grid-channel-renderer")[',
        i - 1,
        '].data'
      )
    # Get data from the webpage
    data <- remDr$executeScript(script)
    # If subscriber count and name are available create an entry in the list
    if (!is.null(data$title$simpleText) & !is.null(data$subscriberCountText$runs[[1]]$text)) {
      # If subscriber count is less than 300000, do not create an entry
      if (convertToNum(data$subscriberCountText$runs[[1]]$text) < 300000) return(NULL)
      # If URL already exists, do not create an entry
      if (data$navigationEndpoint$commandMetadata$webCommandMetadata$url %in% ids) return(NULL)
      return(
        list(
          name = data$title$simpleText,
          subscribers = convertToNum(data$subscriberCountText$runs[[1]]$text),
          url = data$navigationEndpoint$commandMetadata$webCommandMetadata$url
        )
      )
    }
    return(NULL)
  })
  # Remove NULL values from the list
  new_channels <- new_channels[!sapply(new_channels, is.null)]
  
  # If the new channel list is empty, go to the next item on the channel list
  if (length(new_channels) == 0) next

  # Get length of non-empty part of the channel list
  prevlength <- sum(!sapply(youtuber_list, is.null))

  # Store the newly found channels in the appropriate location in the main channel list
  youtuber_list[(prevlength + 1):(prevlength + length(new_channels))] <- new_channels
  # Append the new ID values to the appropriate location in the ID vector
  ids[(prevlength + 1):(prevlength + length(new_channels))] <- sapply(new_channels, function(x) x[[3]])

  # Print values to keep track of progress
  print(new_channels)
  print(i)
}

# Convert the list into dataframe for easy information access and manipulation
current_list <- unique(youtuber_list) %>%
  bind_rows() %>%
  arrange(desc(subscribers))

# save(current_list, file = 'data/final_youtuber_list.RData')


################## Create list of channels from social blade top 5000 #################################
link <- 'https://socialblade.com/youtube/top/5000/mostsubscribed'

# Read lines from the page
lines <- read_html(link) %>%
  html_nodes('div[style*=width]') %>%
  html_text

# Create channel names vector
names <- lines[seq(72, 35065, by = 7)] %>%
  gsub('[^[:print:]]', '', .) %>%
  gsub('\\s{2,}', '', .)

# Create channel subscriptions vector
subscriptions <- lines[seq(74, 35067, by = 7)] %>%
  gsub('[^[:print:]]|\\s', '', .) %>%
  sapply(convertToNum)

# Create channel links vector
links <- read_html(link) %>%
  html_nodes('a[href^="/youtube/"]') %>%
  html_attr('href') %>%
  gsub('/youtube', '', .)

# Create a list of the information structured like the information from the web crawler
# Only include channels that have not yet been found by the crawler
sb_list <- data.frame(name = names, subscribers = subscriptions, url = links[61:5060]) %>%
  filter(!name %in% current_list$name) %>% split(., seq(nrow(.))) %>% 
  lapply(function(x) {
    return(list(name = as.character(x$name), 
                subscribers = as.double(x$subscribers), 
                url = as.character(x$url)))
  })
