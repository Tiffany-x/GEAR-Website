const urlParams = new URLSearchParams(window.location.search);
const idParam = urlParams.get('id'); // Returns "16,9"

// Convert comma-separated string into an array of numbers
const topicIDs = idParam 
  ? idParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
  : [];

    let selectedExistingTopicIds = topicIDs;
    console.log(topicIDs)



document.addEventListener('DOMContentLoaded', async () => {

    const urlParams = new URLSearchParams(window.location.search);
    
    // Get initial page (default to 1)
    const initialPage = parseInt(urlParams.get('page')) || 1;
    
    // Get search text from URL if present
    const searchText = urlParams.get('text');
    if (searchText) {
        document.getElementById('search-text').value = searchText;
    }
    
    // Fetch articles for the initial page
    await fetchArticles(initialPage);

    const searchInput = document.getElementById('topicSearch');
    const dropdownArea = document.getElementById('dropdown');
    const dropdown = document.getElementById('dropdown-list');
    const selectedTags = document.getElementById('box');
    const hiddenInput = document.getElementById('hiddenTopics');
    const MAX_TOPICS = 3;
    let availableTopics = [];
    document.getElementById('value1').textContent = 1;

    
    try {

        // Initialize in sequence
        await fetchTopics();
        console.log("Available topics:", availableTopics);
        
        await renderExistingTags();
        console.log("Rendered existing tags");

        await fetchArticles();
        console.log("Fetched initial articles");
        
    } catch (error) {
        console.error("Initialization error:", error);
    }

    setupEventListeners();
    updateSearchInputState();

    async function renderExistingTags() {
        const selectedTags = document.getElementById('box');
        selectedTags.innerHTML = ''; // Clear existing tags
        
        if (selectedExistingTopicIds.length === 0) return;

        // Fetch topic names for the IDs
        const response = await fetch('/experts/get-topic.php');
        const data = await response.json();
        const availableTopics = data.topics || [];

        selectedExistingTopicIds.forEach(id => {
            const topic = availableTopics.find(t => t.topicId == id);
            if (topic) {
                const tag = document.createElement('div');
                tag.className = 'filter-list';
                tag.style = 'background-color: var(--off-bg)';
                tag.innerHTML = `
                    <h1 class="filter-texts">${topic.topic_name}</h1>
                    <svg width="17" class="tag-remove" data-id="${topic.topicId}"
                    height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line y1="-1" x2="19.5775" y2="-1" transform="matrix(0.754188 0.656659 -0.628793 0.777572 0.832275 1.57214)" stroke="#F27457" stroke-width="2"/>
                        <line y1="-1" x2="19.5775" y2="-1" transform="matrix(-0.754188 0.656659 0.628793 0.777572 16.168 1.57214)" stroke="#F27457" stroke-width="2"/>
                    </svg>
                `;
                selectedTags.appendChild(tag);

                // Add remove handler
                tag.querySelector('.tag-remove').addEventListener('click', function(e) {
                    e.stopPropagation();
                    const id = this.getAttribute('data-id');
                    selectedExistingTopicIds = selectedExistingTopicIds.filter(tId => tId != id);
                    if (selectedExistingTopicIds == 0) {
                        const params = new URLSearchParams();
                        if (selectedExistingTopicIds.length > 0) {
                            params.append('id', selectedExistingTopicIds.join(','));
                        }
                        if (searchText) {
                            params.append('text', searchText);
                        }
                        
                        // Always go to page 1 when performing a new search
                        params.append('page', 1);
                        window.location.href = `/publications.html?${params.toString()}`;
                    }
                    tag.remove();
                    updateUIState();
                });
            }
        });

        updateUIState();
    }

    // Setup all event listeners
    function setupEventListeners() {
        document.getElementById('start-filter').addEventListener('click', function() {
            if (selectedExistingTopicIds.length >= MAX_TOPICS) return;
            renderDropdown(availableTopics, searchInput.value.toLowerCase());
            dropdownArea.style.display = 'block';
            searchInput.focus();
        });

        searchInput.addEventListener('click', handleSearchFocus);
        searchInput.addEventListener('input', handleSearchInput);
        
        document.addEventListener('click', function(e) {
            const isClickInside = searchInput.contains(e.target) || 
                                dropdownArea.contains(e.target) ||
                                document.getElementById('start-filter').contains(e.target);
            
            if (!isClickInside) {
                dropdownArea.style.display = 'none';
            }
        });

        document.getElementById('clear-search').addEventListener('click', () => {
            document.getElementById('search-text').value = '';
            const params = new URLSearchParams();
            if (selectedExistingTopicIds.length > 0) {
                params.append('id', selectedExistingTopicIds.join(','));
            }
            if (searchText) {
                params.append('text', document.getElementById('search-text').value);
            }
            
            window.location.href = `publications.html?${params.toString()}`;
        });

        // Setup keyboard navigation
        setupKeyboardNavigation();
    }

    // Fetch topics from server
    async function fetchTopics() {
        try {
            console.log("Fetching topics...");
            const response = await fetch('/experts/get-topic.php');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("Topics response:", data);
            
            if (data.topics) {
                availableTopics = data.topics;
            } else {
                console.warn("No topics array in response");
                availableTopics = [];
            }
        } catch (error) {
            console.error('Error fetching topics:', error);
            availableTopics = [];
            throw error;
        }
    }

    document.getElementById('search-text').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('search-articles').click();
        }
    });

    function showNotification(message, duration = 3000) {
        let notification = document.getElementById('notification-popup');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification-popup';
            notification.className = 'notification-popup';
            document.body.appendChild(notification);
        }
        
        // Set message and show
        notification.textContent = message;
        notification.classList.add('show');
        
        // Hide after duration
        setTimeout(() => {
            notification.classList.remove('show');
        }, duration);
    }

    document.getElementById('search-articles').addEventListener('click', function(e) {
        e.preventDefault();
        if (document.getElementById('search-text').value === '' && selectedExistingTopicIds.length === 0) {
            showNotification("Please enter a search term or select a topic")
            return;
        }
        
        // Get search text
        const searchText = document.getElementById('search-text').value.trim();
        
        // If we have both topics and search text
        if (selectedExistingTopicIds.length > 0 || searchText) {
            const params = new URLSearchParams();
            if (selectedExistingTopicIds.length > 0) {
                params.append('id', selectedExistingTopicIds.join(','));
            }
            if (searchText) {
                params.append('text', searchText);
            }
            
            // Always go to page 1 when performing a new search
            params.append('page', 1);
            
            window.location.href = `/publications.html?${params.toString()}`;
        }
    });

    // Fetch articles with topic filtering
    async function fetchArticles(page = 1) {
        console.log("Fetching articles for page", page);
        
        try {
            const params = new URLSearchParams();
            
            // Add topic IDs if any are selected
            if (selectedExistingTopicIds.length > 0) {
                selectedExistingTopicIds.forEach(id => params.append('topic_ids[]', id));
            }
            
            // Add search text if provided
            const searchText = document.getElementById('search-text').value.trim();
            if (searchText) {
                params.append('search', searchText);
            }
            
            // Add pagination parameters
            params.append('page', page);
            params.append('per_page', 10);
            
            const response = await fetch(`fetch-articles-page.php?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.status !== 'success' || !result.data) {
                throw new Error("Invalid API response structure");
            }
            
            const articles = result.data.articles || [];
            const totalCount = result.data.count?.total || 0;
            
            document.getElementById('total').textContent = totalCount;
            document.getElementById('value2').textContent = articles.length; // Show actual count for current page
            
            renderArticles(articles);
            setupPagination(totalCount, page);
            
        } catch (error) {
            console.error("Error in fetchArticles:", error);
            document.getElementById('publications').innerHTML = `
                <p class="error-message">Error loading articles: ${error.message}</p>
            `;
        }
    }

    // Update your pagination function to match your HTML structure
    function setupPagination(totalItems, currentPage) {
        const totalPages = Math.ceil(totalItems / 10);
        
        // Update current page display
        document.getElementById('current-page').textContent = currentPage;
        
        // Handle previous/first buttons
        if (currentPage > 1) {
            document.getElementById('first-page').style.visibility = 'visible';
            document.getElementById('previous-page').style.visibility = 'visible';
            
            document.getElementById('first-page').onclick = () => {
                fetchArticles(1);
                updateUrlWithPage(1);
            };
            
            document.getElementById('previous-page').onclick = () => {
                fetchArticles(currentPage - 1);
                updateUrlWithPage(currentPage - 1);
            };
        } else {
            document.getElementById('first-page').style.visibility = 'hidden';
            document.getElementById('previous-page').style.visibility = 'hidden';
        }
        
        // Handle next/last buttons
        if (currentPage < totalPages) {
            document.getElementById('next-page').style.visibility = 'visible';
            document.getElementById('last-page').style.visibility = 'visible';
            
            document.getElementById('next-page').onclick = () => {
                fetchArticles(currentPage + 1);
                updateUrlWithPage(currentPage + 1);
            };
            
            document.getElementById('last-page').onclick = () => {
                fetchArticles(totalPages);
                updateUrlWithPage(totalPages);
            };
        } else {
            document.getElementById('next-page').style.visibility = 'hidden';
            document.getElementById('last-page').style.visibility = 'hidden';
        }
    }

    // Update URL with current page and search parameters
    function updateUrlWithPage(page) {
        const params = new URLSearchParams();
        
        // Add topic IDs if any are selected
        if (selectedExistingTopicIds.length > 0) {
            params.append('id', selectedExistingTopicIds.join(','));
        }
        
        // Add search text if provided
        const searchText = document.getElementById('search-text').value.trim();
        if (searchText) {
            params.append('text', searchText);
        }
        
        // Add current page
        params.append('page', page);
        
        window.history.pushState({}, '', `?${params.toString()}`);
    }


    function renderArticles(articles) {
        let container = document.getElementById('publications');
        container.innerHTML = '';
        
        if (!articles || articles.length === 0) {
            container.innerHTML = '<p class="no-results">No articles found matching your criteria</p>';
            return;
        }
        
        articles.forEach(article => {
            const articleDiv = document.createElement('div');
            articleDiv.className = 'article';
            articleDiv.innerHTML = `
                 <a class="publication" href="read-publication.html?id=${article.id}">
                    <div class="pub-dets">
                        <h1 class="titles" style="font-size: 24px; font-weight: 700; align-self: flex-start;">
                            <span id="pub-title">${article.title}</span></h1>
                        <p class="text" style="font-size: 16px; align-self: flex-start;">${article.description}</p>
                        <p style="color: var(--links); font-size: 16px; font-family: 'Cinzel'; align-self: flex-start;">${article.date}</p>
                    </div>
                    <img class="pub-img" src="experts/${article.image}"></img>
                </a>
            `;
            container.appendChild(articleDiv);
        });
    }

    // Add tag to selection
    function addTag(topic) {
        if (selectedExistingTopicIds.length >= MAX_TOPICS) return;
        if (selectedExistingTopicIds.includes(topic.topicId)) return;
        
        selectedExistingTopicIds.push(topic.topicId);
        hiddenInput.value = JSON.stringify(selectedExistingTopicIds);

        const tag = document.createElement('div');
        tag.className = 'filter-list';
        tag.style = "background-color: var(--off-bg)";
        tag.innerHTML = `
            <h1 class="filter-texts">${topic.topic_name}</h1>
            <svg width="17" class="tag-remove" data-id="${topic.topicId}"
            height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line y1="-1" x2="19.5775" y2="-1" transform="matrix(0.754188 0.656659 -0.628793 0.777572 0.832275 1.57214)" stroke="#F27457" stroke-width="2"/>
                <line y1="-1" x2="19.5775" y2="-1" transform="matrix(-0.754188 0.656659 0.628793 0.777572 16.168 1.57214)" stroke="#F27457" stroke-width="2"/>
            </svg>
        `;
        
        selectedTags.appendChild(tag);
        document.getElementById("selected-no").textContent = selectedExistingTopicIds.length;

        tag.querySelector('.tag-remove').style = "cursor: pointer;"

        tag.querySelector('.tag-remove').addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.getAttribute('data-id');
            selectedExistingTopicIds = selectedExistingTopicIds.filter(tId => tId != id);
            tag.remove();
            updateUIState();
            console.log(selectedExistingTopicIds)
        });

        searchInput.value = '';
        dropdownArea.style.display = 'none';
        updateSearchInputState();
    }

    // Render dropdown options
    function renderDropdown(topicsToShow, searchTerm) {
        dropdown.innerHTML = '';
        
        const unselectedTopics = topicsToShow.filter(topic => 
            !selectedExistingTopicIds.includes(topic.topicId)
        );
        
        if (unselectedTopics.length === 0) {
            if (searchTerm && selectedExistingTopicIds.length < MAX_TOPICS) {
                const noResults = document.createElement('div');
                noResults.className = 'dropdown-item no-results';
                noResults.textContent = `No matching topics found${searchTerm ? ` for "${searchTerm}"` : ''}`;
                dropdown.appendChild(noResults);
            }
            return;
        }

        unselectedTopics.forEach(topic => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.tabIndex = 0;
            item.textContent = topic.topic_name;
            
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                addTag(topic);
            });
            
            dropdown.appendChild(item);
        });
    }

    // Update UI state
    function updateUIState() {
        const searchButton = document.getElementById('search-articles');
        searchButton.disabled = selectedExistingTopicIds.length === 0;
        document.getElementById('selected-no').textContent = selectedExistingTopicIds.length;
        hiddenInput.value = JSON.stringify(selectedExistingTopicIds);
    }

    // Clear all button functionality
    function setupClearAllButton() {
        const link = document.createElement('a');
        const clearAllBtn = document.createElement('button');
        clearAllBtn.textContent = 'Clear All';
        clearAllBtn.className = 'clear-all-btn';
        clearAllBtn.addEventListener('click', () => {
            selectedExistingTopicIds = [];
            document.getElementById('box').innerHTML = '';
            updateUIState();
        });
        const params = new URLSearchParams();
            if (selectedExistingTopicIds.length > 0) {
                params.append('id', selectedExistingTopicIds.join(','));
            }
            if (searchText) {
                params.append('text', searchText);
            }
            
        link.href = `publications.html?${params.toString()}`;
        // Add it near your selected tags
        link.append(clearAllBtn)
        document.getElementById('box').appendChild(link);
    }
    // Search functionality
    function handleSearchInput() {
        if (selectedExistingTopicIds.length >= MAX_TOPICS) return;
        
        const searchTerm = this.value.toLowerCase().trim();
        console.log("Search term:", searchTerm, "Selected IDs:", selectedExistingTopicIds);
        
        const filteredTopics = availableTopics.filter(topic => {
            const isNotSelected = !selectedExistingTopicIds.includes(topic.topicId);
            const matchesSearch = searchTerm === '' || 
                                topic.topic_name.toLowerCase().includes(searchTerm);
            return isNotSelected && matchesSearch;
        });
        
        console.log("Filtered topics:", filteredTopics);
        renderDropdown(filteredTopics, searchTerm);
    }

    function handleSearchFocus() {
        if (selectedExistingTopicIds.length >= MAX_TOPICS) return;
        
        const unselectedTopics = availableTopics.filter(topic => 
            !selectedExistingTopicIds.includes(topic.topicId)
        );
        
        renderDropdown(unselectedTopics, searchInput.value.toLowerCase());
        dropdownArea.style.display = 'block';
        searchInput.focus();
    }

    function updateSearchInputState() {
        searchInput.disabled = selectedExistingTopicIds.length >= MAX_TOPICS;
        searchInput.placeholder = searchInput.disabled 
            ? 'Maximum topics selected' 
            : 'Search topics';
    }

    function getVisibleDropdownItems() {
        return dropdown.querySelectorAll('.dropdown-item:not(.no-results)');
    }

    // Keyboard navigation - fixed version
    function setupKeyboardNavigation() {
        // Search input keyboard handling
        searchInput.addEventListener('keydown', function(e) {
            const items = getVisibleDropdownItems();
            
            if (e.key === 'ArrowDown' && items.length > 0) {
                e.preventDefault();
                if (dropdownArea.style.display !== 'block') {
                    dropdownArea.style.display = 'block';
                }
                items[0].focus();
            }
            
            if (e.key === 'Enter') {
                e.preventDefault();
                if (dropdownArea.style.display !== 'block') {
                    dropdownArea.style.display = 'block';
                    handleSearchFocus();
                }
            }
            
            if (e.key === 'Escape') {
                e.preventDefault();
                dropdownArea.style.display = 'none';
            }
        });

        // Dropdown keyboard handling
        dropdown.addEventListener('keydown', function(e) {
            const items = getVisibleDropdownItems();
            const focused = document.activeElement;
            const currentIndex = Array.from(items).findIndex(item => item === focused);
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    const nextIndex = currentIndex + 1;
                    if (nextIndex < items.length) {
                        items[nextIndex].focus();
                    } else {
                        items[0]?.focus();
                    }
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    if (currentIndex <= 0) {
                        searchInput.focus();
                    } else {
                        items[currentIndex - 1].focus();
                    }
                    break;
                    
                case 'Enter':
                    e.preventDefault();
                    if (focused) {
                        focused.click();
                    }
                    break;
                    
                case 'Escape':
                    e.preventDefault();
                    searchInput.focus();
                    dropdownArea.style.display = 'none';
                    break;
            }
        });
    }

    // Search articles by title/description
    function searchArticlesByText() {
        const searchTerm = document.getElementById('search-text').value.toLowerCase().trim();
        const articles = document.querySelectorAll('.publication');
        
        articles.forEach(article => {
            const title = article.querySelector('.titles').textContent.toLowerCase();
            const description = article.querySelector('.text').textContent.toLowerCase();
            const isMatch = title.includes(searchTerm) || description.includes(searchTerm);
            article.style.display = isMatch ? 'flex' : 'none';
        });
    }
    
});