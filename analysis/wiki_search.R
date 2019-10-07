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
  if (length(results$query) == 0) return(NULL)
  res_df <- bind_rows(unlist(results$query, recursive = FALSE)) %>%
    arrange(index) 
  
  
  for (i in 1:nrow(res_df)) {
    page_url <- res_df$fullurl[i]
    
    page_lines <- read_html(page_url) %>% 
      html_nodes('#bodyContent') %>% 
      html_text %>%
      tolower()
    
    if (length(grep('youtube star|youtuber', page_lines)) != 0) break
  }
  
  if (length(grep('youtube star|youtuber', page_lines)) == 0) return(NULL)
  
  page_lines <- page_lines %>% 
    strsplit(split = '\n') %>%
    unlist() 
  
  match_list <- page_lines %>% 
    grep('apology|controversy|controversial|apologized|controversies',
         ., value = TRUE)
  
  return(list(page_url, match_list))
}

# Function to search channel on Wikitubia and report instances of keywords on the found page
getResultsTube <- function(x) {
  request <- paste0('https://youtube.fandom.com/wiki/Special:Search?query=',
                    gsub('\\s|\\&|\\#', '%20', as.character(x)))
  print(as.character(x))

  url_node <- read_html(request) %>%
    html_node('li.result') 
  
  if (is.na(url_node)) return(list(NULL, NULL))
  
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

#load('data/wikipedia_apology_data.RData')
#load('data/wikitubia_apology_data.RData')

# Data frame containing channels with apologies and url detected
apology_data <- wiki_apology_data

apology_indices <- sapply(apology_data, function(item) length(item[[2]]) > 0)

temp <- current_list %>%
  mutate(numfound = sapply(apology_data, function(item) length(item[[2]])),
         urlfound = sapply(apology_data, function(item) item[[1]])) %>%
  filter(apology_indices)

unqiueurls <- data.frame(unlist(unique(temp$urlfound)))


