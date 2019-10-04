library(dplyr)
library(rvest)
library(jsonlite)
library(parallel)

# Load final scraped and merged youtube channel list
load('data/final_youtuber_list.RData')

# Function to search channel on Wikipedia and report instances of keywords on the found page
getResultsWiki <- function(x) {
  request <- paste0('https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=',
                    gsub('\\s|\\&|\\#', '%20', as.character(x)), 
                    '&prop=info&inprop=url&format=json')
  
  results <- read_html(request) %>% html_node('p') %>% html_text() %>% fromJSON
  if (length(results) < 3) return(NULL)
  res_df <- bind_rows(unlist(results[[3]], recursive = FALSE)) %>%
    arrange(index) 
  
  page_url <- res_df$fullurl[1]
  
  page_lines <- read_html(page_url) %>% 
    html_nodes('#bodyContent') %>% 
    html_text %>% 
    strsplit(split = '\n') %>%
    unlist() %>%
    tolower()
  
  match_list <- page_lines %>% 
    grep('apology|controversy|controversial|apologized|controversies',
         ., value = TRUE)
  
  return(list(res_df, page_url, match_list))
}

# Function to search channel on Wikitubia and report instances of keywords on the found page
getResultsTube <- function(x) {
  request <- paste0('https://youtube.fandom.com/wiki/Special:Search?query=',
                    gsub('\\s|\\&|\\#', '%20', as.character(x)))
  print(as.character(x))

  url_node <- read_html(request) %>%
    html_node('li.result') 
  
  if(is.na(url_node)) return(list(NULL, NULL))
  
  page_url <- html_node(url_node, 'a') %>% 
    html_attr('href')

  page_lines <- read_html(page_url) %>% 
    html_text %>% 
    strsplit(split = '\n') %>%
    unlist() %>%
    tolower()
  
  match_list <- page_lines %>% 
    grep('apology|controversy|controversial|apologized|controversies',
         ., value = TRUE)
  
  return(list(page_url, match_list))
}

# Generate and store apology data from Wikipedia
#wiki_apology_data <- mclapply(current_list$name, getResultsWiki, mc.cores = getOption("mc.cores", 14L))
#save(wiki_apology_data, file = 'data/wikipedia_apology_data.RData')

# Generate and store apology data from Wikitubia
#tube_apology_data <- mclapply(current_list$name, getResultsTube, mc.cores = getOption("mc.cores", 14L))
#save(tube_apology_data, file = 'data/wikitubia_apology_data.RData')

load('wikitubia_apology_data.RData')

# Data frame containing channels with apologies and url detected
temp <- current_list[sapply(tube_apology_data, function(item) length(item[[2]]) > 0),] %>%
  mutate(numfound = 
           sapply(tube_apology_data, 
                  function(item) length(item[[2]]))[sapply(tube_apology_data, 
                                                           function(item) length(item[[2]]) > 0)],
         urlfound = 
           sapply(tube_apology_data, 
                  function(item) item[[1]])[sapply(tube_apology_data, 
                                                   function(item) length(item[[2]]) > 0)])

tempurls <- data.frame(unlist(unique(temp$urlfound)))
