const urlParams = new URLSearchParams(window.location.search);
const idParam = urlParams.get('id'); // Returns "16,9"

// Convert comma-separated string into an array of numbers
const topicIDs = idParam 
  ? idParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
  : [];

    let selectedExistingTopicIds = topicIDs;
    console.log(topicIDs)



document.addEventListener('DOMContentLoaded', async () => {

    if (selectedExistingTopicIds.length == 0) {
        document.getElementById('search-authors').disabled = true;
    }

    await renderExistingTags()

     try {
    const response = await fetch('fetch-authors.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: topicIDs // Send as array like [16, 9]
      })
    });

    if (!response.ok) throw new Error('Network response failed');
    
    const data = await response.json();
    
    if (data.status === 'success') {
                console.log("Success, producing...");

                data.data.forEach(author => {
                    // Get first letter of author's name, capitalized
                    const firstLetter = author.name.trim().charAt(0).toUpperCase();

                    // Find the matching letter section by data-letter attribute
                    const group = document.querySelector(`.letter-section[data-letter="${firstLetter}"]`);
                    if (!group) return; // Skip if no such group

                    const expertArea = group.querySelector('.actual-experts');
                    if (!expertArea) return;

                    // Create author card
                    const authorCard = document.createElement('div');
                    authorCard.innerHTML = `
                        <a class="expert" href="about-expert.html?id=${author.id}">
                            <div style="display: flex;">
                                <img src="experts/${author.profile}" class="profile-pic">
                            </div>
                            <div class="exp-info">
                                <h1 class="titles" style="font-size: 28px;">
                                    <span id="event-name">${author.name}</span>
                                </h1>
                                <p class="text" style="font-size: 20px; color: var(--links);">${author.position}</p>
                            </div>
                        </a>
                    `;
                    expertArea.appendChild(authorCard);
                });

                // Now hide any empty letter sections
                document.querySelectorAll('.letter-section').forEach(group => {
                    const expertArea = group.querySelector('.actual-experts');
                    if (!expertArea || expertArea.children.length === 0) {
                        group.style.display = 'none';
                    }
                });

                const activeLetters = new Set();
                document.querySelectorAll('.letter-section').forEach(section => {
                    const experts = section.querySelector('.actual-experts');
                    if (experts && experts.children.length > 0) {
                        const letter = section.dataset.letter.toLowerCase(); // e.g., "J" -> "j"
                        activeLetters.add(letter);
                    }
                });
                console.log(activeLetters)
                document.querySelectorAll('#alphabet .letters').forEach(letterEl => {
                    const letter = letterEl.textContent.trim().toLowerCase();
                    if (!activeLetters.has(letter)) {
                        letterEl.classList.add('inactive');
                    }
                });

                document.querySelectorAll('#alphabet .letters:not(.inactive)').forEach(letterEl => {
                letterEl.addEventListener('click', () => {
                    const letter = letterEl.textContent.trim().toUpperCase();
                    const target = document.querySelector(`.letter-section[data-letter="${letter}"]`);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                    });
                });


            } else {
                console.error(data.error);
            }
        } catch (error) {
            console.error('Fetch Error:', error);
        }


        var searchInput = document.getElementById('topicSearch');
        var dropdownArea = document.getElementById('dropdown');
        var dropdown = document.getElementById('dropdown-list');
        var selectedTags = document.getElementById('box');
        var hiddenInput = document.getElementById('hiddenTopics');
        var MAX_TOPICS = 3;
        let availableTopics = [];
        let localTopics = [];

        //fetching topics from server
        function fetchTopics() {
            return fetch('/experts/get-topic.php')
                .then(response => response.json())
                .then(data => {
                    availableTopics = data.topics || [];
                    return availableTopics;
        });}

        fetchTopics();


        document.getElementById('start-filter').addEventListener('click', function () {
            if (selectedExistingTopicIds.length >= MAX_TOPICS) return;
            renderDropdown(availableTopics, searchInput.value.toLowerCase());
            searchInput.focus();

            dropdownArea.style.display = 'block';

        })

        

            // Enhanced focus handler
        function handleSearchFocus() {
            if (selectedExistingTopicIds.length >= MAX_TOPICS) return;
            renderDropdown(availableTopics, searchInput.value.toLowerCase());
            dropdownArea.style.display = 'block';
        }

        function updateSearchInputState() {
            searchInput.disabled = selectedExistingTopicIds.length >= MAX_TOPICS;
            
            if (searchInput.disabled) {
                searchInput.placeholder = 'Maximum topics selected';
            } else {
                searchInput.placeholder = 'Search topics';
            }
        }

        searchInput.addEventListener('click', handleSearchFocus);


        // Hide dropdown when clicking outside
        document.addEventListener('click', function(e) {
            const isClickInside = searchInput.contains(e.target) || 
                                dropdownArea.contains(e.target) ||
                                document.getElementById('start-filter').contains(e.target);
            
            if (!isClickInside) {
                dropdownArea.style.display = 'none';
            }
        });
            // Search functionality
        searchInput.addEventListener('input', function() {
            console.log(selectedExistingTopicIds.length)
            if (selectedExistingTopicIds.length >= MAX_TOPICS) return;
            
            var searchTerm = this.value.toLowerCase();
            
            if (searchTerm.length < 1) {
                renderDropdown(availableTopics, '');
                return;
            }
            var filtered = availableTopics.filter(topic =>
                topic.topic_name.toLowerCase().includes(searchTerm)
            );

            renderDropdown(filtered, searchTerm);
        });

                // Add tag to selection
        function addTag(topic) {
            if (selectedExistingTopicIds.length >= MAX_TOPICS) return;

                if (selectedExistingTopicIds.includes(topic.topicId)) return;
                selectedExistingTopicIds.push(topic.topicId);

            // Update hidden input with combined data
            hiddenInput.value = JSON.stringify({
                existingIds: selectedExistingTopicIds
            });

            var tag = document.createElement('div');
            tag.className = 'filter-list';
            tag.innerHTML = `
                    <h1 class="filter-texts">${topic.topic_name}</h1>
                    <svg width="17" class="tag-remove" data-id="${topic.topicId || topic.tempId}"
                    height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line y1="-1" x2="19.5775" y2="-1" transform="matrix(0.754188 0.656659 -0.628793 0.777572 0.832275 1.57214)" stroke="#F27457" stroke-width="2"/>
                        <line y1="-1" x2="19.5775" y2="-1" transform="matrix(-0.754188 0.656659 0.628793 0.777572 16.168 1.57214)" stroke="#F27457" stroke-width="2"/>
                      </svg>
            `;
            
            selectedTags.appendChild(tag);
            document.getElementById('search-authors').disabled = false;
            console.log(selectedExistingTopicIds);

            
            document.getElementById("selected-no").textContent = selectedExistingTopicIds.length;


    tag.querySelector('.tag-remove').addEventListener('click', function(e) {
        e.stopPropagation();
        const id = this.getAttribute('data-id');
        
            selectedExistingTopicIds = selectedExistingTopicIds.filter(tId => tId != id);
            
        
        // Update UI and state
        tag.remove();
        hiddenInput.value = JSON.stringify({
            existingIds: selectedExistingTopicIds
        });
        
        updateSearchInputState();
        if (selectedExistingTopicIds.length == 0) {
            document.getElementById('search-authors').disabled = true;
        }
        setupClearAllButton();
        document.getElementById("selected-no").textContent = selectedExistingTopicIds.length;
        console.log(getSelectedTopics());

    });

            searchInput.value = '';
            dropdownArea.style.display = 'none';
            updateSearchInputState();
        }

        // Render dropdown options
    function renderDropdown(topics, searchTerm) {
        searchInput.click();
        dropdown.innerHTML = '';
        // Filter out already selected topics
        const unselectedTopics = topics.filter(topic => 
            !selectedExistingTopicIds.includes(topic.topicId)
        );
        if (unselectedTopics.length > 0) {

            unselectedTopics.forEach(topic => {
                var item = document.createElement('div');
                item.className = 'dropdown-item';
                item.textContent = topic.topic_name;
                item.tabIndex = 0;
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    addTag(topic);
                });
                dropdown.appendChild(item);
            });
        }

        // Add "Create new" option if needed
        if (searchTerm && 
            !availableTopics.some(t => t.topic_name.toLowerCase() === searchTerm.toLowerCase()) && 
            selectedExistingTopicIds.length < MAX_TOPICS) {
            var createItem = document.createElement('div');
            createItem.className = 'dropdown-item create';
            createItem.innerHTML = `The topic "<strong>${searchTerm}</strong>" does not exist`;
            createItem.style = "enabled: false;"
            dropdown.appendChild(createItem);
        }
    }

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
                    tag.remove();
                    updateUIState();
                });
            }
        });

        updateUIState();
        setupClearAllButton();
    }

    // Update UI state (enable/disable buttons, show/hide elements)
    function updateUIState() {
        const searchButton = document.getElementById('search-authors');
        const selectedTags = document.getElementById('box');
        
        searchButton.disabled = selectedExistingTopicIds.length === 0;
        document.getElementById('selected-no').textContent = selectedExistingTopicIds.length;
        
        // Update hidden input
        document.getElementById('hiddenTopics').value = JSON.stringify({
            existingIds: selectedExistingTopicIds
        });
    }

    // Add clear all button functionality
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
        link.href = "experts.html";
        // Add it near your selected tags
        link.append(clearAllBtn)
        document.getElementById('box').appendChild(link);
    }
    
    document.getElementById('search-authors').addEventListener('click', function() {
        console.log(selectedExistingTopicIds);
        window.location.href = `/experts.html?id=${selectedExistingTopicIds}`;

    })
    // Get all selected topics (for form submission)
    function getSelectedTopics() {
        return {
            existingIds: selectedExistingTopicIds,
            allTopics: [
                ...availableTopics.filter(topic => selectedExistingTopicIds.includes(topic.topicId)),
            ]
        };
    }


    function setupKeyboardNavigation() {
        // Search input keyboard handling
        searchInput.addEventListener('keydown', function(e) {
            
            var items = dropdown.querySelectorAll('.dropdown-item');
            
            if (e.key === 'ArrowDown' && items.length > 0) {
                e.preventDefault();
                if (dropdownArea.style.display !== 'block') {
                    dropdownArea.style.display = 'block';
                }
                items[0].focus();
            }
            
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });

        // Dropdown keyboard handling
        dropdown.addEventListener('keydown', function(e) {
            var items = dropdown.querySelectorAll('.dropdown-item');
            var focused = document.activeElement;
            var currentIndex = Array.from(items).findIndex(item => item === focused);
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    var nextIndex = currentIndex + 1;
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

    updateSearchInputState();
    setupKeyboardNavigation()
    console.log(selectedExistingTopicIds);


    // Initial focus setup
    searchInput.addEventListener('mousedown', function() {
        if (selectedExistingTopicIds.length  >= MAX_TOPICS) return;
        this.focus();
        handleSearchFocus();
    });

    // Initialize search input state
    updateSearchInputState();

    // Add this near your other event listeners

    document.getElementById('search-text').addEventListener('input', searchAuthors);

    function searchAuthors() {
        const searchTerm = document.getElementById('search-text').value.toLowerCase().trim();
        const authorCards = document.querySelectorAll('.expert'); // Each author card
        
        authorCards.forEach(card => {
            const fullName = card.querySelector('#event-name').textContent.toLowerCase();
            // Split into first and last names (assuming format is "First Last")
            const [firstName, lastName] = fullName.split(' ');
            
            // Check if search term matches start of first OR last name
            const matchesFirstName = firstName?.startsWith(searchTerm);
            const matchesLastName = lastName?.startsWith(searchTerm);
            const isMatch = matchesFirstName || matchesLastName;
            
            const letterSection = card.closest('.letter-section');
            
            if (isMatch || searchTerm === '') {
                card.style.display = 'flex';
                letterSection.style.display = 'block';
            } else {
                card.style.display = 'none';
                // Hide the letter section if all its authors are hidden
                const hasVisibleAuthors = Array.from(letterSection.querySelectorAll('.expert'))
                    .some(c => c.style.display !== 'none');
                letterSection.style.display = hasVisibleAuthors ? 'block' : 'none';
            }
        });
    }

    

    document.getElementById('clear-search').addEventListener('click', () => {
    document.getElementById('search-text').value = '';
    searchAuthors();
});
});
    