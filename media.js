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
    
    // Fetch medias for the initial page
    await fetchMedias(initialPage);

    const searchInput = document.getElementById('topicSearch');
    const dropdownArea = document.getElementById('dropdown');
    const dropdown = document.getElementById('dropdown-list');
    const selectedTags = document.getElementById('box');
    const hiddenInput = document.getElementById('hiddenTopics');
    const MAX_TOPICS = 3;
    let availableTopics = [];
    
    try {

        // Initialize in sequence
        await fetchTopics();
        console.log("Available topics:", availableTopics);
        
        await renderExistingTags();
        console.log("Rendered existing tags");

        await fetchMedias();
        console.log("Fetched initial medias");
        
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
                        window.location.href = `/media.html?${params.toString()}`;
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
            
            window.location.href = `media.html?${params.toString()}`;
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
            document.getElementById('search-medias').click();
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

    document.getElementById('search-medias').addEventListener('click', function(e) {
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
            
            window.location.href = `/media.html?${params.toString()}`;
        }
    });

    // Fetch medias with topic filtering
    async function fetchMedias(page = 1) {
        console.log("Fetching medias for page", page);
        
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
            
            const response = await fetch(`media.php?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.status !== 'success' || !result.data) {
                throw new Error("Invalid API response structure");
            }
            
            const medias = result.data.medias || [];
            const totalCount = result.data.count?.total || 0;
            
            // document.getElementById('total').textContent = totalCount;
            // document.getElementById('value2').textContent = medias.length; // Show actual count for current page
            
            renderMedias(medias);
            setupPagination(totalCount, page);
            
        } catch (error) {
            console.error("Error in fetchMedias:", error);
            document.getElementById('media-layout').innerHTML = `
                <p class="error-message">Error loading medias: ${error.message}</p>
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
                fetchMedias(1);
                updateUrlWithPage(1);
            };
            
            document.getElementById('previous-page').onclick = () => {
                fetchMedias(currentPage - 1);
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
                fetchMedias(currentPage + 1);
                updateUrlWithPage(currentPage + 1);
            };
            
            document.getElementById('last-page').onclick = () => {
                fetchMedias(totalPages);
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


    function renderMedias(medias) {
        let container = document.getElementById('media-layout');
        container.innerHTML = '';
        
        if (!medias || medias.length === 0) {
            container.innerHTML = '<p class="no-results">No medias found matching your criteria</p>';
            return;
        }
        
        medias.forEach(media => {
            const iconDiv = document.createElement('div');
            iconDiv.className = 'med-type';

            if (media.type === "video") {
                iconDiv.innerHTML = `<svg width="60" height="60" viewBox="0 0 60 60" fill="var(--links)" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.6011 43.2935V17.4185C19.6011 16.7101 19.8511 16.116 20.3511 15.636C20.8511 15.156 21.4344 14.9168 22.1011 14.9185C22.3094 14.9185 22.5286 14.9493 22.7586 15.011C22.9886 15.0726 23.2069 15.1668 23.4136 15.2935L43.7886 28.231C44.1636 28.481 44.4452 28.7935 44.6336 29.1685C44.8219 29.5435 44.9152 29.9393 44.9136 30.356C44.9119 30.7726 44.8186 31.1685 44.6336 31.5435C44.4486 31.9185 44.1669 32.231 43.7886 32.481L23.4136 45.4185C23.2052 45.5435 22.9869 45.6376 22.7586 45.701C22.5302 45.7643 22.3111 45.7951 22.1011 45.7935C21.4344 45.7935 20.8511 45.5535 20.3511 45.0735C19.8511 44.5935 19.6011 44.0001 19.6011 43.2935Z" fill="white"/>
                    </svg>`
            } else {
                iconDiv.innerHTML = `<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M35.1963 52.2097V47.0847C38.9463 46.0013 41.9671 43.918 44.2588 40.8347C46.5505 37.7513 47.6963 34.2513 47.6963 30.3347C47.6963 26.418 46.5505 22.918 44.2588 19.8347C41.9671 16.7513 38.9463 14.668 35.1963 13.5847V8.45966C40.363 9.62632 44.5713 12.2413 47.8213 16.3047C51.0713 20.368 52.6963 25.0447 52.6963 30.3347C52.6963 35.6247 51.0713 40.3022 47.8213 44.3672C44.5713 48.4322 40.363 51.0463 35.1963 52.2097ZM7.69629 37.8972V22.8972H17.6963L30.1963 10.3972V50.3972L17.6963 37.8972H7.69629ZM35.1963 40.3972V20.2722C37.1546 21.1888 38.6863 22.5638 39.7913 24.3972C40.8963 26.2305 41.448 28.2305 41.4463 30.3972C41.4463 32.5222 40.8938 34.4913 39.7888 36.3047C38.6838 38.118 37.153 39.4822 35.1963 40.3972ZM25.1963 22.5222L19.8213 27.8972H12.6963V32.8972H19.8213L25.1963 38.2722V22.5222Z" fill="white"/>
                    </svg>`
            }
            const mediaDiv = document.createElement('div');
            mediaDiv.className = 'media';
            mediaDiv.innerHTML = `
                 <a class="a-media" href=view-media.html?id=${media.id}>
                    <div id="thumbnail" style="background: url(experts/${media.thumbLink})">
                    </div>
                    <div class="media-name">
                        <h1 class="titles" style="font-size: 28px; color: #000;">
                            <span id="med-name">${media.title}</span> </h1>
                    </div>
                </a>
            `;
            container.appendChild(mediaDiv);
            document.getElementById('thumbnail').appendChild(iconDiv);
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
        const searchButton = document.getElementById('search-medias');
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
            
        link.href = `media.html?${params.toString()}`;
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

    // Search medias by title/description
    function searchMediasByText() {
        const searchTerm = document.getElementById('search-text').value.toLowerCase().trim();
        const medias = document.querySelectorAll('.publication');
        
        medias.forEach(media => {
            const title = media.querySelector('.titles').textContent.toLowerCase();
            const description = media.querySelector('.text').textContent.toLowerCase();
            const isMatch = title.includes(searchTerm) || description.includes(searchTerm);
            media.style.display = isMatch ? 'flex' : 'none';
        });
    }
    
});