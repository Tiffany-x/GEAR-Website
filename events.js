document.addEventListener('DOMContentLoaded', async () => {
    await fetchEvents();

    async function fetchEvents() {
        console.log("Fetching events");
        
        try {
            const response = await fetch('events.php');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('API Response:', result);
            
            // Validate response
            if (result.status !== 'success') {
                throw new Error(result.message || "API request failed");
            }
            
            // Convert single event to array if needed
            const events = Array.isArray(result.data) ? result.data : [result.data];

            // Date handling
            const normalizeDate = (dateStr) => {
                const d = new Date(dateStr);
                d.setHours(0, 0, 0, 0);
                return d;
            };

            const isPastDate = (dateStr) => normalizeDate(dateStr) < new Date();
            const isFutureDate = (dateStr) => normalizeDate(dateStr) > new Date();

            // Process events
            events.forEach(event => {
                const online = event.online === 1 ? "Online" : "";
                const date = new Date(event.date);
                const day = date.getDate();
                const monthName = date.toLocaleString('default', { month: 'short' });
                const year = date.getFullYear();
                const time = event.start.split(':').slice(0, 2).join(':');

                function isAm(time24) {
                    const [hours] = time24.split(':');
                    return hours < 12; // Returns true for AM, false for PM
                }


                let period = "";
                isAm(time)? period = "AM" : period = "PM";

                const box = document.createElement('div');
                box.innerHTML = `

                     <a class="an-event" href="view-event.html?id=${event.eventID}">
                            <svg width="182"  style="position:absolute; z-index: 1;" height="182" viewBox="0 0 182 182" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="91" cy="91" r="90.5" fill="white" stroke="var(--links)"/>
                            </svg>
                                <div class="event-date">
                                    <h1 class="titles" id="day" style="z-index: 2;">${day}</h1>
                                    <h1 class="titles" style="font-size: 28px; z-index: 2;" id="month">${monthName} ${year}</h1>
                                </div>
                            
                            <div class="event-dets">
                                <p class="text" id="location" style="color: var(--main);">${event.venue} | ${online}</p>
                                <h1 class="titles" style="font-size: 24px; color: black;">
                                    <span id="event-name">${event.title}</span></h1>
                                <p class="text" id="time" style="color: var(--main);">${time} ${period}</p>
                            </div>
                        </a>`;

                const container = isFutureDate(event.date) 
                    ? document.getElementById('future-events')
                    : document.getElementById('past-events');
                
                container.appendChild(box);
            });
            
        } catch (error) {
            console.error("Error in fetchEvents:", error);
            const errorContainer = document.getElementById('future-events') || 
                                 document.getElementById('past-events');
            errorContainer.innerHTML = `
                <p class="error-message">Error loading events: ${error.message}</p>
            `;
        }
    }
});