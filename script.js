// Function to get weather for selected city
function getWeather() {
    console.log('clicked getWeather');
    
    // Get the selected city from dropdown
    const citySelect = document.getElementById('citySelect');
    const selectedCity = citySelect.value;
    const weatherResult = document.getElementById('weatherResult');
    
    // Show loading message
    weatherResult.innerHTML = 'Loading weather data...';
    weatherResult.className = '';
    
    // Map dropdown values to actual city names for the API
    const cityNames = {
        'london': 'London,UK',
        'newyork': 'New York,USA',
        'tokyo': 'Tokyo,Japan',
        'sydney': 'Sydney,Australia',
        'cairo': 'Cairo,Egypt'
    };
    
    const actualCityName = cityNames[selectedCity];
    const apiKey = 'CQGDV5V7U4YRKMW9FFVCBPZ8X';
    
    // Use CORS proxy to avoid CORS issues
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    const weatherUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${actualCityName}?unitGroup=metric&key=${apiKey}&contentType=json`;
    
    // Try with proxy first, fallback to direct if proxy fails
    const fetchWeather = (useProxy = true) => {
        const url = useProxy ? proxyUrl + weatherUrl : weatherUrl;
        
        fetch(url)
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Weather data received:', data);
            
            // Extract current weather information
            const currentWeather = data.currentConditions;
            const temperature = currentWeather.temp;
            const conditions = currentWeather.conditions;
            const humidity = currentWeather.humidity;
            const windSpeed = currentWeather.windspeed;
            
            // Format the weather display
            const weatherDisplay = `
                <h3>Weather in ${actualCityName}</h3>
                <p><strong>Temperature:</strong> ${temperature}°C</p>
                <p><strong>Conditions:</strong> ${conditions}</p>
                <p><strong>Humidity:</strong> ${humidity}%</p>
                <p><strong>Wind Speed:</strong> ${windSpeed} km/h</p>
            `;
            
            weatherResult.innerHTML = weatherDisplay;
            weatherResult.className = 'success';
            
            // Also send to webhook for tracking
            sendWeatherToWebhook(actualCityName, temperature, conditions, humidity, windSpeed);
        })
        .catch(error => {
            console.error('Weather API error:', error);
            
            // If proxy failed, try direct call
            if (useProxy) {
                console.log('Proxy failed, trying direct call...');
                fetchWeather(false);
            } else {
                weatherResult.innerHTML = `Error fetching weather data: ${error.message}`;
                weatherResult.className = 'error';
            }
        });
    };
    
    // Start the weather fetch
    fetchWeather(true);
}

// Separate function to send weather data to webhook
function sendWeatherToWebhook(city, temperature, conditions, humidity, windSpeed) {
    const webhookUrl = 'https://tsc-jt.app.n8n.cloud/webhook-test/weather';
    
    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            city: city,
            temperature: temperature,
            conditions: conditions,
            humidity: humidity,
            windSpeed: windSpeed
        })
    })
    .then(response => response.json())
    .then(webhookData => {
        console.log('Webhook response:', webhookData);
    })
    .catch(webhookError => {
        console.error('Webhook error:', webhookError);
        // Don't show webhook error to user since weather data was retrieved successfully
    });
}

// Function to send a note
function sendNote() {
    console.log('clicked sendNote');
    
    // Get the note text from input
    const noteInput = document.getElementById('noteInput');
    const noteText = noteInput.value.trim();
    const noteStatus = document.getElementById('noteStatus');
    
    // Validate input
    if (!noteText) {
        noteStatus.innerHTML = 'Please enter a note before submitting.';
        noteStatus.className = 'error';
        return;
    }
    
    // Show loading message
    noteStatus.innerHTML = 'Sending note...';
    noteStatus.className = '';
    
    // Send note to webhook
    const webhookUrl = 'https://tsc-jt.app.n8n.cloud/webhook/notes';
    
    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note: noteText })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Note webhook response:', data);
        noteStatus.innerHTML = `Note sent successfully: "${noteText}"`;
        noteStatus.className = 'success';
        noteInput.value = ''; // Clear input
    })
    .catch(error => {
        console.error('Note webhook error:', error);
        noteStatus.innerHTML = `Error sending note: ${error.message}`;
        noteStatus.className = 'error';
    });
}

// Function to get and display the last 5 notes
function getNotes() {
    console.log('clicked getNotes');
    
    const noteStatus = document.getElementById('noteStatus');
    
    // Show loading message
    noteStatus.innerHTML = 'Retrieving notes...';
    noteStatus.className = '';
    
    // Use the dedicated getNotes webhook endpoint
    const webhookUrl = 'https://tsc-jt.app.n8n.cloud/webhook/getNotes';
    
    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'getNotes' })
    })
    .then(response => {
        console.log('Get notes response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Get notes response:', data);
        
                
        // Handle the webhook response structure
        let allNotes = [];
        if (data && data.data && Array.isArray(data.data)) {
            // Current format: { "data": [...] }
            allNotes = data.data;
        } else if (Array.isArray(data) && data.length > 0 && data[0].data) {
            // Alternative format: [{ "data": [...] }]
            allNotes = data[0].data;
        } else if (Array.isArray(data)) {
            if (data.length > 0 && Array.isArray(data[0])) {
                // If it's an array of arrays, flatten them
                allNotes = data.flat();
            } else {
                // If it's a single array of objects
                allNotes = data;
            }
        }
        
        // Filter out null notes and get last 5
        const validNotes = allNotes.filter(item => item.note !== null && item.note !== undefined);
        const lastFiveNotes = validNotes.slice(-5).reverse(); // Get last 5 and show newest first
        
        let notesHtml = '<h4>Last 5 Notes:</h4>';
        
        if (lastFiveNotes.length > 0) {
            notesHtml += '<ul>';
            lastFiveNotes.forEach((noteObj, index) => {
                const formattedDate = new Date(noteObj.createdAt).toLocaleString();
                notesHtml += `<li><strong>Note ${validNotes.length - index}:</strong> ${noteObj.note}<br><small>${formattedDate}</small></li>`;
            });
            notesHtml += '</ul>';
        } else {
            notesHtml += '<p>No valid notes found. Submit some notes first!</p>';
        }
        
        noteStatus.innerHTML = notesHtml;
        noteStatus.className = 'success';
    })
    .catch(error => {
        console.error('Get notes error:', error);
        
        // Fallback to demo mode with mock data when webhook fails
        console.log('Webhook failed, showing demo with mock data...');
        
        const mockNotes = [
            'This is a sample note 1',
            'This is a sample note 2', 
            'This is a sample note 3',
            'This is a sample note 4',
            'This is a sample note 5'
        ];
        
        let notesHtml = '<h4>Last 5 Notes (Demo Mode):</h4><ul>';
        mockNotes.forEach((note, index) => {
            notesHtml += `<li><strong>Note ${index + 1}:</strong> ${note}</li>`;
        });
        notesHtml += '</ul>';
        notesHtml += '<p style="color: #666; font-size: 0.9em;">⚠️ Demo mode: Configure your webhook to see real notes</p>';
        
        noteStatus.innerHTML = notesHtml;
        noteStatus.className = 'success';
    });
}

// Function for the surprise button - Christian History Facts
function runButton3() {
    console.log('clicked runButton3');
    
    // Get the result display area
    const button3Result = document.getElementById('button3Result');
    
    // Show loading message
    button3Result.innerHTML = 'Fetching Christian history fact...';
    button3Result.className = '';
    
    // Get today's date
    const today = new Date();
    const month = today.getMonth() + 1; // JavaScript months are 0-indexed
    const day = today.getDate();
    const dateKey = `${month}-${day}`;
    
    // Database of Christian martyr facts by date
    const martyrFacts = {
        '1-1': 'On this day in 404 AD, Saint Telemachus, a monk, was martyred in Rome for trying to stop a gladiatorial fight. His death led Emperor Honorius to ban gladiatorial contests.',
        '1-2': 'On this day in 533 AD, Saint Basil the Great, one of the Cappadocian Fathers, was commemorated. He defended the divinity of the Holy Spirit against heretics.',
        '1-3': 'On this day in 250 AD, Saint Daniel the Stylite began his 33-year ministry atop a pillar in Syria, inspiring countless with his extreme asceticism.',
        '1-4': 'On this day in 1642 AD, Saint Isaac Jogues and his companions were martyred by Mohawk warriors in what is now New York, becoming some of the first North American martyrs.',
        '1-5': 'On this day in 70 AD, Saint Simon the Zealot, apostle of Jesus, was traditionally martyred in Persia for preaching the Gospel.',
        '1-6': 'On this day in 1084 AD, Saint Romuald, founder of the Camaldolese order, died. He established hermitages that combined solitary and communal monastic life.',
        '1-7': 'On this day in 303 AD, Saint Felix of Nola was martyred during the Diocletian persecution. He escaped execution multiple times through divine intervention.',
        '1-8': 'On this day in 1559 AD, Saint Peter Canisius, Doctor of the Church, began his work in Germany, counteracting Protestant Reformation through education.',
        '1-9': 'On this day in 304 AD, Saint Julian of Antioch was martyred for refusing to sacrifice to Roman gods. His relics were said to have healing powers.',
        '1-10': 'On this day in 236 AD, Saint Fabian became Pope and was later martyred during the Decian persecution, famously chosen when a dove landed on his head.',
        '1-11': 'On this day in 356 AD, Saint Anthony the Great, considered the father of monasticism, died at age 105 after decades of desert asceticism.',
        '1-12': 'On this day in 1208 AD, Saint Peter of Verona, a Dominican inquisitor, was martyred by assassins hired by Cathar heretics.',
        '1-13': 'On this day in 304 AD, Saint Hilary of Poitiers was exiled for defending Christ\'s divinity against Arian heresy, earning the title "Athanasius of the West."',
        '1-14': 'On this day in 98 AD, Saint Felix of Nola was martyred. He was known for his charity and for hiding from persecution in a cave for three years.',
        '1-15': 'On this day in 250 AD, Saint Paul of Thebes, traditionally considered the first hermit, began his desert solitude after witnessing Christian martyrdom.',
        '1-16': 'On this day in 304 AD, Saint Marcellus I, Pope, was martyred during the Diocletian persecution for continuing Christian worship.',
        '1-17': 'On this day in 355 AD, Saint Anthony the Great sold all his possessions after hearing the Gospel "Go, sell what you have and give to the poor."',
        '1-18': 'On this day in 362 AD, Saint Athanasius returned from exile, having defended Nicene Christianity against Arianism despite multiple banishments.',
        '1-19': 'On this day in 379 AD, Saint Basil the Great died, leaving behind profound writings on monasticism and the Holy Spirit.',
        '1-20': 'On this day in 250 AD, Saint Sebastian was martyred, shot with arrows for his faith but survived, only to be clubbed to death later.',
        '1-21': 'On this day in 304 AD, Saint Agnes of Rome, just 13 years old, was martyred for refusing to marry a pagan nobleman, declaring Christ as her bridegroom.',
        '1-22': 'On this day in 304 AD, Saint Vincent of Saragossa was martyred, enduring brutal torture while maintaining his faith and inspiring converts.',
        '1-23': 'On this day in 1937 AD, Blessed Miguel Pro, Mexican Jesuit, was martyred by firing squad, famously shouting "Viva Cristo Rey!" as he died.',
        '1-24': 'On this day in 41 AD, Saint John the Baptist was beheaded by Herod Antipas, fulfilling his role as the forerunner of Christ.',
        '1-25': 'On this day in 1559 AD, Saint Paul Miki and 25 companions were crucified in Nagasaki, Japan, becoming the first canonized saints of Japan.',
        '1-26': 'On this day in 269 AD, Saint Timothy, disciple of Paul and first Bishop of Ephesus, was martyred for opposing pagan festivals.',
        '1-27': 'On this day in 307 AD, Saint George of Cappadocia, Bishop of Alexandria, was martyred for defending the Nicene Creed against Arian persecution.',
        '1-28': 'On this day in 814 AD, Saint Charlemagne died, having unified much of Europe and promoted Christianity throughout his empire.',
        '1-29': 'On this day in 304 AD, Saint Papias of Hierapolis was martyred. He was an early Christian writer who preserved oral traditions from the apostles.',
        '1-30': 'On this day in 1077 AD, Saint Gildas the Wise, British historian, died. His writings provide crucial accounts of early British Christianity.',
        '1-31': 'On this day in 311 AD, Saint Cyrus and John, physician and soldier, were martyred in Egypt for healing Christians without charge.',
        '2-1': 'On this day in 1329 AD, Saint Brigid of Ireland, patroness of Ireland, died. She founded the double monastery of Kildare and was known for her generosity.',
        '2-2': 'On this day in 312 AD, Saint Lawrence of Rome was martyred, famously grilled alive and telling his executioners "Turn me over, I\'m done on this side."',
        '2-3': 'On this day in 565 AD, Saint Simeon Stylites the Younger died after living 45 years on a pillar, continuing his uncle\'s extreme ascetic tradition.',
        '2-4': 'On this day in 708 AD, Saint Aldric, Bishop of Le Mans, died. He was known for his charity and for building churches throughout his diocese.',
        '2-5': 'On this day in 590 AD, Saint Agatha of Sicily was martyred, having her breasts cut off for refusing to renounce her faith. She is patroness of nurses.',
        '2-6': 'On this day in 891 AD, Saint Photius the Great, Patriarch of Constantinople, died. He was a major figure in the Photian Schism and a renowned scholar.',
        '2-7': 'On this day in 303 AD, Saint Perpetua and Felicity were martyred in Carthage. Perpetua kept a diary of her imprisonment, one of earliest Christian texts by a woman.',
        '2-8': 'On this day in 1587 AD, Saint Mary, Queen of Scots, was executed. Her Catholic faith made her a martyr in the eyes of many Catholics.',
        '2-9': 'On this day in 287 AD, Saint Apollonia of Alexandria was martyred, having all her teeth extracted before being thrown into a fire.',
        '2-10': 'On this day in 549 AD, Saint Scholastica, twin sister of Saint Benedict, died. She founded a women\'s monastery following her brother\'s rule.',
        '2-11': 'On this day in 1858 AD, Saint Bernadette Soubirous first saw the Virgin Mary at Lourdes, leading to countless healings and conversions.',
        '2-12': 'On this day in 901 AD, Saint Ethelwold, Bishop of Winchester, died. He was a leader of the Benedictine Reform in England.',
        '2-13': 'On this day in 1549 AD, Saint Catherine of Genoa died. She wrote profound mystical works on purgatory and the spiritual life.',
        '2-14': 'On this day in 269 AD, Saint Valentine was martyred in Rome. He performed Christian marriages despite Emperor Claudius II banning them.',
        '2-15': 'On this day in 557 AD, Saint Sigfrid of Sweden died. He was an English missionary who converted many Swedes to Christianity.',
        '2-16': 'On this day in 1517 AD, Saint Catherine of Ricci died. She was known for her mystical experiences and for bearing the stigmata.',
        '2-17': 'On this day in 1600 AD, Saint Philomena was discovered. Her tomb contained symbols of her martyrdom: anchor, palm, and lily.',
        '2-18': 'On this day in 1546 AD, Saint Martin Luther died. Though Protestant, his stand against corruption helped reform the entire Western Church.',
        '2-19': 'On this day in 197 AD, Saint Polycarp, Bishop of Smyrna, was martyred. He was a disciple of John the Apostle and defended orthodoxy against heresies.',
        '2-20': 'On this day in 1431 AD, Saint Joan of Arc was burned at the stake for heresy, though she was later canonized as a saint.',
        '2-21': 'On this day in 1072 AD, Saint Peter Damian died. He was a reformer who fought simony and clerical corruption in the 11th century.',
        '2-22': 'On this day in 1072 AD, Saint Margaret of Scotland died. She was Hungarian-born queen who reformed Scottish church and cared for the poor.',
        '2-23': 'On this day in 155 AD, Saint Polycarp was burned at the stake. When the flames failed to harm him, he was stabbed to death instead.',
        '2-24': 'On this day in 1582 AD, Saint Aloysius Gonzaga was born. He died caring for plague victims, becoming patron saint of youth.',
        '2-25': 'On this day in 616 AD, Saint Ethelbert of Kent died. He was the first Anglo-Saxon king to convert to Christianity.',
        '2-26': 'On this day in 380 AD, Saint Porphyry of Gaza died. He converted the entire city from paganism, destroying all pagan temples.',
        '2-27': 'On this day in 273 AD, Saint Gabriel Possenti died. He was known as the "Saint of Handguns" for his courage against bandits.',
        '2-28': 'On this day in 1943 AD, Saint Titus Brandsma, Dutch Carmelite, died in Dachau concentration camp for defending Catholic press freedom.',
        '3-1': 'On this day in 589 AD, Saint David of Wales died. He established monasticism in Wales and is patron saint of Wales.',
        '3-2': 'On this day in 1857 AD, Saint John Henry Newman was received into the Catholic Church. He later became a cardinal and Doctor of the Church.',
        '3-3': 'On this day in 303 AD, Saint Katherine Drexel was born. She founded schools for African American and Native American children.',
        '3-4': 'On this day in 561 AD, Saint Piran of Cornwall died. He is credited with discovering tin smelting and is patron saint of Cornwall.',
        '3-5': 'On this day in 251 AD, Saint Adrian of Nicomedia was martyred. He was a pagan guard who converted after seeing Christian martyrs\' courage.',
        '3-6': 'On this day in 203 AD, Saint Perpetua and her companions were martyred in the arena, facing wild beasts with joy and prayer.',
        '3-7': 'On this day in 1274 AD, Saint Thomas Aquinas died. His Summa Theologica remains one of the most influential theological works ever written.',
        '3-8': 'On this day in 1123 AD, Saint John of God was born. He founded the Brothers Hospitallers and is patron saint of the sick.',
        '3-9': 'On this day in 1568 AD, Saint Dominic Savio died at age 14, becoming the youngest non-martyr to be canonized.',
        '3-10': 'On this day in 309 AD, Saint Anastasia was martyred for visiting Christian prisoners. Her name means "resurrection" in Greek.',
        '3-11': 'On this day in 548 AD, Saint Eulalia of Barcelona was martyred at age 13 for refusing to worship Roman gods.',
        '3-12': 'On this day in 604 AD, Saint Gregory the Great, Pope, died. He wrote influential works on pastoral care and Gregorian chant.',
        '3-13': 'On this day in 203 AD, Saint Nicephorus was martyred for destroying pagan idols. His name means "bearer of victory."',
        '3-14': 'On this day in 415 AD, Saint Matilda of Germany died. She was queen known for her charity and for building churches.',
        '3-15': 'On this day in 717 AD, Saint Clement of Ireland died. He was known as "the first-born of the saints of Ireland" for his learning.',
        '3-16': 'On this day in 1190 AD, Saint Julian the Hospitaller was commemorated. He devoted his life to caring for travelers and the sick.',
        '3-17': 'On this day in 461 AD, Saint Patrick of Ireland died. He escaped slavery to return as a missionary and convert the Irish.',
        '3-18': 'On this day in 978 AD, Saint Edward the Martyr was killed at age 16. He became king at 14 and was murdered for his piety.',
        '3-19': 'On this day in 309 AD, Saint Joseph died. Though not martyred, he is honored as the patron saint of the universal Church.',
        '3-20': 'On this day in 249 AD, Saint Cuthbert of Lindisfarne died. He was a hermit-bishop known for his love of nature and animals.',
        '3-21': 'On this day in 1556 AD, Saint Thomas of Villanova died. He was known as "the father of the poor" for his extreme charity.',
        '3-22': 'On this day in 337 AD, Saint Constantine the Great died. He legalized Christianity and founded Constantinople.',
        '3-23': 'On this day in 1542 AD, Saint Catherine de\' Vigri died. She was an artist, musician, and mystic who experienced visions of Christ.',
        '3-24': 'On this day in 809 AD, Saint Ludger died. He was the first Bishop of Münster and evangelized the Saxons.',
        '3-25': 'On this day in 33 AD, the Annunciation was celebrated - when the Angel Gabriel announced to Mary that she would bear Christ.',
        '3-26': 'On this day in 655 AD, Saint Ethelwald of Lindisfarne died. He was a monk who produced beautiful illuminated manuscripts.',
        '3-27': 'On this day in 307 AD, Saint Rupert of Salzburg was born. He evangelized Bavaria and Austria, establishing many churches.',
        '3-28': 'On this day in 597 AD, Saint Guntramnus died. He was a king known for his justice and charity, defending the weak against nobles.',
        '3-29': 'On this day in 1139 AD, Saint Berthold of Calabria died. He founded the Carmelite order after living as a hermit on Mount Carmel.',
        '3-30': 'On this day in 1872 AD, Saint John Baptist de La Salle died. He founded the Brothers of the Christian Schools for poor children.',
        '3-31': 'On this day in 1022 AD, Saint Guy of Pomposa died. He founded a monastery that became famous for its library and scholarship.',
        '4-1': 'On this day in 909 AD, Saint Hugh of Cluny was born. He was one of the most influential abbots in medieval Christendom.',
        '4-2': 'On this day in 1872 AD, Saint Francis of Paola died. He founded the Minim Friars and was known for his gift of prophecy.',
        '4-3': 'On this day in 1075 AD, Saint Richard of Chichester died. He was known for his charity and for defending Church rights against the king.',
        '4-4': 'On this day in 397 AD, Saint Ambrose of Milan died. He baptized Augustine and fought Arian heresy throughout his life.',
        '4-5': 'On this day in 1419 AD, Saint Vincent Ferrer died. He converted thousands through his powerful preaching during the Western Schism.',
        '4-6': 'On this day in 1528 AD, Saint Alphonsus Rodriguez was born. He was a Jesuit doorkeeper who attained great sanctity in humble service.',
        '4-7': 'On this day in 1498 AD, Saint John of Sahagún died. He was known as "the apostle of Spain" for his reform work.',
        '4-8': 'On this day in 1378 AD, Saint Catherine of Siena died. She was a mystic who persuaded the Pope to return to Rome from Avignon.',
        '4-9': 'On this day in 1241 AD, Saint Walburga died. She was an English missionary to Germany known for her healing powers.',
        '4-10': 'On this day in 1585 AD, Saint Teresa of Ávila died. She was a mystic, reformer, and Doctor of the Church who founded the Discalced Carmelites.',
        '4-11': 'On this day in 1079 AD, Saint Stanislaus of Kraków was martyred by King Bolesław II for speaking truth to power.',
        '4-12': 'On this day in 1204 AD, Saint Teresa of Los Andes was born. She was a Chilean Discalced Carmelite who died at age 19.',
        '4-13': 'On this day in 632 AD, Saint Herman Joseph was born. He was known for his mystical marriage to the Virgin Mary.',
        '4-14': 'On this day in 73 AD, Saint Justin Martyr was beheaded in Rome. He was a philosopher who converted to Christianity and wrote defenses of the faith.',
        '4-15': 'On this day in 1649 AD, Saint Kateri Tekakwitha was born. She was the first Native American saint, known as "Lily of the Mohawks."',
        '4-16': 'On this day in 1191 AD, Saint Turibius of Mogrovejo was born. He was a bishop who walked over 20,000 miles visiting his Peruvian diocese.',
        '4-17': 'On this day in 735 AD, Saint Stephen I of Hungary died. He converted Hungary to Christianity and is its patron saint.',
        '4-18': 'On this day in 1521 AD, Saint John of the Cross was born. He was a mystic poet who wrote "The Spiritual Canticle" and "Dark Night of the Soul."',
        '4-19': 'On this day in 1058 AD, Saint Leo IX, Pope, died. He was a reformer who fought simony and clerical marriage.',
        '4-20': 'On this day in 1314 AD, Saint Margaret of Cortona died. She was a penitent who became a Franciscan tertiary after a sinful youth.',
        '4-21': 'On this day in 1109 AD, Saint Anselm of Canterbury died. He was a philosopher who formulated the ontological argument for God\'s existence.',
        '4-22': 'On this day in 1665 AD, Saint Josefa de la Cruz died. She was a Spanish mystic who experienced the stigmata and divine visions.',
        '4-23': 'On this day in 303 AD, Saint George was martyred. He is the patron saint of England, famous for slaying the dragon.',
        '4-24': 'On this day in 1199 AD, Saint Fidelis of Sigmaringen was martyred. He was a lawyer who became a Capuchin and preached against heresy.',
        '4-25': 'On this day in 799 AD, Saint Mark the Evangelist was commemorated. He wrote the second Gospel and founded the Church of Alexandria.',
        '4-26': 'On this day in 1212 AD, Saint Francis of Assisi received his calling. He rebuilt the church of San Damiano and began his order.',
        '4-27': 'On this day in 1278 AD, Saint Zita of Lucca died. She was a domestic servant who attained great holiness through humble work.',
        '4-28': 'On this day in 1605 AD, Saint Louis de Montfort was born. He promoted devotion to Mary through his book "True Devotion to Mary."',
        '4-29': 'On this day in 1380 AD, Saint Catherine of Siena experienced her "spiritual marriage" to Christ, receiving a mystical ring.',
        '4-30': 'On this day in 570 AD, Saint Pius V was born. He was the Pope who implemented the Tridentine reforms and excommunicated Queen Elizabeth I.',
        '5-1': 'On this day in 1555 AD, Saint Joseph the Worker was established. This feast honors Jesus\' foster father as a model for all workers.',
        '5-2': 'On this day in 373 AD, Saint Athanasius of Alexandria died. He was the champion of Nicene Christianity against Arianism.',
        '5-3': 'On this day in 1274 AD, Saint James the Just, brother of Jesus and first Bishop of Jerusalem, was martyred by being thrown from the temple.',
        '5-4': 'On this day in 1419 AD, Saint Bernardino of Siena died. He was known as "the Apostle of Italy" for his powerful preaching.',
        '5-5': 'On this day in 1525 AD, Saint Angelo Carletti died. He was a Franciscan who worked for peace between warring Italian city-states.',
        '5-6': 'On this day in 1523 AD, Saint François de Laval was born. He was the first bishop of Quebec and established the Canadian Church.',
        '5-7': 'On this day in 558 AD, Saint John of Beverly died. He was known for his gift of healing and for educating Saint Bede.',
        '5-8': 'On this day in 1373 AD, Saint Julian of Norwich experienced her revelations of divine love, writing "All shall be well, and all shall be well."',
        '5-9': 'On this day in 1715 AD, Saint Pachomius was commemorated. He is considered the founder of Christian monasticism.',
        '5-10': 'On this day in 1291 AD, Saint William of Rochester was martyred. He was a baker who was murdered by his apprentice for his charity.',
        '5-11': 'On this day in 330 AD, Saint Mamertinus died. He was a monk who founded the Abbey of Saint-Maur.',
        '5-12': 'On this day in 254 AD, Saint Pancras was martyred at age 14 for refusing to sacrifice to Roman gods.',
        '5-13': 'On this day in 1517 AD, Saint John of the Cross was born. He was a Carmelite mystic and Doctor of the Church.',
        '5-14': 'On this day in 640 AD, Saint Michael the Archangel appeared at Monte Gargano, establishing the first Western shrine to the archangel.',
        '5-15': 'On this day in 393 AD, Saint Dymphna was martyred at age 15 by her pagan father. She is patroness of those with mental illness.',
        '5-16': 'On this day in 683 AD, Saint Brendan the Navigator died. He was an Irish monk who sailed across the Atlantic in a leather boat.',
        '5-17': 'On this day in 1540 AD, Saint Paschal Baylon was born. He was a simple lay brother who experienced profound mystical visions.',
        '5-18': 'On this day in 526 AD, Saint Pope John I died in prison after being imprisoned by Theodoric the Great.',
        '5-19': 'On this day in 804 AD, Saint Alcuin of York died. He was a scholar who revived learning in Charlemagne\'s empire.',
        '5-20': 'On this day in 1506 AD, Saint Bernardino of Siena was canonized. He was known for his devotion to the Holy Name of Jesus.',
        '5-21': 'On this day in 1471 AD, Saint Christopher was commemorated. He is traditionally said to have carried the Christ child across a river.',
        '5-22': 'On this day in 337 AD, Saint Constantine the Great was baptized. He was the first Roman emperor to embrace Christianity.',
        '5-23': 'On this day in 1498 AD, Saint Rita of Cascia died. She was known as the "Saint of the Impossible" for her difficult life and miracles.',
        '5-24': 'On this day in 1543 AD, Saint Mary was assumed into heaven. This feast celebrates her being taken body and soul into paradise.',
        '5-25': 'On this day in 735 AD, Saint Bede the Venerable died. He was an English monk whose "Ecclesiastical History" is crucial for understanding early England.',
        '5-26': 'On this day in 626 AD, Saint Philip Neri was born. He was known as the "Apostle of Rome" for his joyful approach to evangelization.',
        '5-27': 'On this day in 1565 AD, Saint Augustine of Canterbury died. He was sent by Pope Gregory the Great to convert the Anglo-Saxons.',
        '5-28': 'On this day in 1794 AD, Saint Louis-Marie Grignion de Montfort died. He promoted total consecration to Jesus through Mary.',
        '5-29': 'On this day in 1431 AD, Saint Joan of Arc was burned at the stake. She died crying "Jesus, Jesus, Jesus" as the flames rose.',
        '5-30': 'On this day in 1431 AD, Saint Joan of Arc was condemned. Her courage and faith inspired countless conversions even in death.',
        '5-31': 'On this day in 1806 AD, Saint Philip Neri died. He founded the Oratorians and was known for his sense of humor and holiness.',
        '6-1': 'On this day in 1846 AD, Saint Justin Martyr was commemorated. He was a philosopher who used reason to defend Christian faith.',
        '6-2': 'On this day in 1865 AD, Saint Marcellin Champagnat died. He founded the Marist Brothers to educate poor children.',
        '6-3': 'On this day in 1162 AD, Saint Thomas Aquinas was born. He wrote the Summa Theologica and became a Doctor of the Church.',
        '6-4': 'On this day in 756 AD, Saint Francis Caracciolo was born. He founded the Minor Clerks Regular and practiced extreme asceticism.',
        '6-5': 'On this day in 754 AD, Saint Boniface was martyred. He was the "Apostle of Germany" who chopped down the oak of Thor.',
        '6-6': 'On this day in 1795 AD, Saint Norbert of Xanten died. He founded the Premonstratensian order and fought heresy throughout Europe.',
        '6-7': 'On this day in 1847 AD, Saint Robert Bellarmine died. He was a Jesuit cardinal who defended the faith against Protestant errors.',
        '6-8': 'On this day in 632 AD, Saint Meriadoc died. He was a Breton bishop known for his charity and for walking on water.',
        '6-9': 'On this day in 68 AD, Saint Ephrem the Syrian died. He was a poet and theologian who wrote hundreds of hymns still used today.',
        '6-10': 'On this day in 1190 AD, Saint Margaret of Scotland died. She was Hungarian-born queen who reformed the Scottish church.',
        '6-11': 'On this day in 323 AD, Saint Barnabas was martyred. He was Paul\'s missionary companion and introduced Paul to the apostles.',
        '6-12': 'On this day in 1899 AD, Saint Anthony Mary Claret died. He was a missionary who founded the Claretians and was archbishop of Cuba.',
        '6-13': 'On this day in 1231 AD, Saint Anthony of Padua died. He was a Franciscan preacher known as the "Wonder Worker" for his miracles.',
        '6-14': 'On this day in 847 AD, Saint Methodius I of Constantinople died. He was a patriarch who defended icons during the iconoclast controversy.',
        '6-15': 'On this day in 1846 AD, Saint Elisha was commemorated. He was a prophet who performed twice as many miracles as Elijah.',
        '6-16': 'On this day in 1216 AD, Saint Pope Innocent III died. He called the Fourth Crusade and shaped medieval papacy.',
        '6-17': 'On this day in 676 AD, Saint Botolph died. He founded a monastery that became a major center of learning in England.',
        '6-18': 'On this day in 1155 AD, Saint Elizabeth of Schönau died. She was a Benedictine mystic who experienced visions of the Virgin Mary.',
        '6-19': 'On this day in 1865 AD, Saint Romuald was commemorated. He founded the Camaldolese hermits, combining solitary and communal life.',
        '6-20': 'On this day in 1591 AD, Saint Aloysius Gonzaga died. He was a Jesuit who gave up wealth to serve plague victims.',
        '6-21': 'On this day in 1208 AD, Saint Raphael the Archangel was commemorated. He is the patron saint of healers and travelers.',
        '6-22': 'On this day in 1535 AD, Saint Thomas More was executed. He chose death over compromising his Catholic faith.',
        '6-23': 'On this day in 79 AD, Saint John the Baptist was born. He was the forerunner of Christ who prepared the way for the Messiah.',
        '6-24': 'On this day in 1579 AD, Saint John the Baptist was commemorated. His feast is celebrated with bonfires and baptisms worldwide.',
        '6-25': 'On this day in 1115 AD, Saint William of York died. He was an archbishop whose election was contested but later vindicated.',
        '6-26': 'On this day in 363 AD, Saint Vigilius of Trent was martyred. He was a bishop who died trying to convert pagans in the Alps.',
        '6-27': 'On this day in 444 AD, Saint Cyril of Alexandria died. He was a theologian who defended Mary\'s title as Mother of God.',
        '6-28': 'On this day in 1991 AD, Saint Irenaeus of Lyons was commemorated. He fought Gnosticism and preserved apostolic teaching.',
        '6-29': 'On this day in 67 AD, Saint Peter and Paul were martyred in Rome. Peter was crucified upside down and Paul was beheaded.',
        '6-30': 'On this day in 1861 AD, Saint Theophane Venard died. He was a missionary to Vietnam who was martyred for his faith.',
        '7-1': 'On this day in 64 AD, Saint Thomas the Apostle died. He brought Christianity to India and is called "Doubting Thomas" for his initial skepticism.',
        '7-2': 'On this day in 1566 AD, Saint Bernardino Realino died. He was a lawyer who became a Jesuit and converted thousands.',
        '7-3': 'On this day in 716 AD, Saint Thomas the Apostle was commemorated. He established churches in India that still exist today.',
        '7-4': 'On this day in 1336 AD, Saint Elizabeth of Portugal died. She was a queen known as "the Peacemaker" for reconciling warring factions.',
        '7-5': 'On this day in 304 AD, Saint Athanasius was commemorated. He was exiled five times for defending Christ\'s divinity against Arianism.',
        '7-6': 'On this day in 1015 AD, Saint Maria Goretti was born. She was murdered at age 11 while resisting rape, forgiving her attacker before dying.',
        '7-7': 'On this day in 1304 AD, Saint Benedict XI, Pope, died. He was a Dominican known for his humility and justice.',
        '7-8': 'On this day in 1589 AD, Saint Priscilla and Aquila were commemorated. They were a married couple who hosted house churches with Paul.',
        '7-9': 'On this day in 1846 AD, Saint Augustine Zhao Rong and companions were martyred in China. They were the first Chinese martyrs.',
        '7-10': 'On this day in 1218 AD, Saint Francis of Assisi received the stigmata. He bore the wounds of Christ for the last two years of his life.',
        '7-11': 'On this day in 1556 AD, Saint Benedict was commemorated. He founded Western monasticism and wrote the Rule that guides monks today.',
        '7-12': 'On this day in 1898 AD, Saint John Gualbert died. He founded the Vallumbrosan order after forgiving his brother\'s killer.',
        '7-13': 'On this day in 1024 AD, Saint Henry II died. He was a Holy Roman Emperor who supported Church reform and was canonized.',
        '7-14': 'On this day in 1223 AD, Saint Francis of Assisi created the first nativity scene. He used live animals to recreate Christ\'s birth.',
        '7-15': 'On this day in 1048 AD, Saint Vladimir the Great died. He converted Russia to Christianity and is its patron saint.',
        '7-16': 'On this day in 1251 AD, Saint Simon Stock received the scapular from Mary. This began the Brown Scapular devotion.',
        '7-17': 'On this day in 180 AD, Saint Alexis of Rome died. He was a wealthy man who lived as a beggar under his parents\' stairs.',
        '7-18': 'On this day in 1505 AD, Saint Camillus de Lellis was born. He founded the Ministers of the Sick and is patron saint of hospitals.',
        '7-19': 'On this day in 1848 AD, Saint Macrina the Elder died. She was the grandmother of Basil the Great and Gregory of Nyssa.',
        '7-20': 'On this day in 1451 AD, Saint Elijah the Prophet was commemorated. He was taken to heaven in a fiery chariot.',
        '7-21': 'On this day in 303 AD, Saint Lawrence of Rome was martyred. When asked for the Church\'s treasures, he presented the poor.',
        '7-22': 'On this day in 1461 AD, Saint Mary Magdalene died. She was the first witness to Christ\'s resurrection and "apostle to the apostles."',
        '7-23': 'On this day in 1373 AD, Saint Bridget of Sweden died. She was a mystic who founded the Bridgettine order and received revelations.',
        '7-24': 'On this day in 1914 AD, Saint Charbel Makhlouf died. He was a Lebanese hermit whose body was found incorrupt after his death.',
        '7-25': 'On this day in 326 AD, Saint James the Greater was martyred. He was the first apostle to die for the faith.',
        '7-26': 'On this day in 1581 AD, Saint Anne and Saint Joachim were commemorated. They are the traditional parents of the Virgin Mary.',
        '7-27': 'On this day in 431 AD, Saint Cyril of Alexandria presided over the Council of Ephesus, defending Mary as Mother of God.',
        '7-28': 'On this day in 450 AD, Saint Germanus of Auxerre died. He was a bishop who fought Pelagianism in Britain.',
        '7-29': 'On this day in 1030 AD, Saint Olaf of Norway died. He was a Viking king who converted Norway to Christianity.',
        '7-30': 'On this day in 1898 AD, Saint Peter Chrysologus died. He was known as "the Doctor of Homilies" for his brilliant preaching.',
        '7-31': 'On this day in 1556 AD, Saint Ignatius of Loyola died. He founded the Jesuit order and wrote the Spiritual Exercises.',
        '8-1': 'On this day in 258 AD, Saint Alphonsus Liguori was born. He founded the Redemptorists and was a moral theologian.',
        '8-2': 'On this day in 258 AD, Saint Peter in Chains was commemorated. This feast celebrates the miraculous release of Peter from prison.',
        '8-3': 'On this day in 715 AD, Saint Stephen I died. He was the first king of Hungary and converted the nation to Christianity.',
        '8-4': 'On this day in 1859 AD, Saint John Vianney died. He was the "Curé of Ars" who spent 18 hours daily hearing confessions.',
        '8-5': 'On this day in 258 AD, Saint Oswald of Northumbria died. He was a king who died praying for his soldiers\' souls.',
        '8-6': 'On this day in 1978 AD, Saint Pope Paul VI died. He implemented the Second Vatican Council reforms.',
        '8-7': 'On this day in 461 AD, Saint Pope Sixtus II was martyred. He and his deacons were killed while celebrating Mass.',
        '8-8': 'On this day in 1221 AD, Saint Dominic died. He founded the Dominican order to preach against heresy.',
        '8-9': 'On this day in 1942 AD, Saint Teresa Benedicta of the Cross died in Auschwitz. She was a Jewish convert who became a Carmelite.',
        '8-10': 'On this day in 258 AD, Saint Lawrence of Rome was martyred. He is the patron saint of deacons and comedians.',
        '8-11': 'On this day in 1253 AD, Saint Clare of Assisi died. She founded the Poor Clares and was the first woman to write a monastic rule.',
        '8-12': 'On this day in 1304 AD, Saint Jane Frances de Chantal was born. She founded the Visitation order with Saint Francis de Sales.',
        '8-13': 'On this day in 587 AD, Saint Maximus the Confessor was martyred. He had his tongue cut off for defending Christ\'s two natures.',
        '8-14': 'On this day in 1048 AD, Saint Maximilian Kolbe died in Auschwitz. He volunteered to die in place of a fellow prisoner.',
        '8-15': 'On this day in 15 AD, the Assumption of Mary was celebrated. This feast celebrates Mary being taken body and soul into heaven.',
        '8-16': 'On this day in 1244 AD, Saint Stephen of Hungary died. He was the first king of Hungary and brought Christianity to the Magyars.',
        '8-17': 'On this day in 1680 AD, Saint Hyacinth died. He was a Dominican who carried a statue of Mary through invading armies.',
        '8-18': 'On this day in 1250 AD, Saint Helena died. She was the mother of Constantine who found the True Cross in Jerusalem.',
        '8-19': 'On this day in 1493 AD, Saint John Eudes was born. He promoted devotion to the Sacred Heart of Jesus and Immaculate Heart of Mary.',
        '8-20': 'On this day in 1153 AD, Saint Bernard of Clairvaux died. He was a Cistercian monk who preached the Second Crusade.',
        '8-21': 'On this day in 1879 AD, Saint Pope Pius X died. He lowered the age for First Communion and fought modernist heresy.',
        '8-22': 'On this day in 1480 AD, Saint Mary was commemorated as Queen of Heaven. This title honors Mary as mother and queen of all creation.',
        '8-23': 'On this day in 1679 AD, Saint Rose of Lima died. She was the first canonized saint of the Americas and known for her extreme penances.',
        '8-24': 'On this day in 410 AD, Saint Bartholomew the Apostle was martyred. He was flayed alive for preaching in Armenia.',
        '8-25': 'On this day in 1270 AD, Saint Louis IX of France died. He was the only French king to be canonized and built Sainte-Chapelle.',
        '8-26': 'On this day in 1910 AD, Saint Teresa of Calcutta was born. She founded the Missionaries of Charity and served the poorest of the poor.',
        '8-27': 'On this day in 387 AD, Saint Monica died. She was the mother of Augustine who prayed for his conversion for 17 years.',
        '8-28': 'On this day in 430 AD, Saint Augustine of Hippo died. He wrote "Confessions" and "City of God," shaping Western thought.',
        '8-29': 'On this day in 885 AD, Saint John the Baptist was martyred. His death defended the sanctity of marriage against Herod\'s adultery.',
        '8-30': 'On this day in 258 AD, Saint Felix and Adauctus were martyred. Felix was a priest and Adauctus was a layman who died with him.',
        '8-31': 'On this day in 658 AD, Saint Aidan of Lindisfarne died. He was an Irish monk who converted Northumbria to Christianity.',
        '9-1': 'On this day in 550 AD, Saint Giles died. He was a hermit who lived with a deer and is patron saint of cripples.',
        '9-2': 'On this day in 590 AD, Saint Pope Gregory I died. He wrote Gregorian chant and sent missionaries to England.',
        '9-3': 'On this day in 263 AD, Saint Gregory the Great was born. He was pope who sent Augustine to convert the Anglo-Saxons.',
        '9-4': 'On this day in 1167 AD, Saint Rosalia died. She was a hermit whose relics ended a plague in Palermo, Sicily.',
        '9-5': 'On this day in 1910 AD, Saint Mother Teresa was born. She founded the Missionaries of Charity and won the Nobel Peace Prize.',
        '9-6': 'On this day in 398 AD, Saint Bertrand of Comminges died. He was a bishop who converted the Gascon people to Christianity.',
        '9-7': 'On this day in 304 AD, Saint Regina was martyred. She was a shepherdess who refused to marry a pagan official.',
        '9-8': 'On this day in 70 AD, Saint Nativity of Mary was celebrated. This feast celebrates Mary\'s birth to Joachim and Anne.',
        '9-9': 'On this day in 1554 AD, Saint Peter Claver died. He was a Jesuit who ministered to slaves for 40 years, calling himself "slave of slaves."',
        '9-10': 'On this day in 1085 AD, Saint Nicholas of Tolentino died. He was known for his visions of purgatory and for fasting strictly.',
        '9-11': 'On this day in 1226 AD, Saint Francis of Assisi died. He received the stigmata and founded the Franciscan order.',
        '9-12': 'On this day in 1683 AD, Saint Holy Name of Mary was celebrated. This feast was established after the Battle of Vienna.',
        '9-13': 'On this day in 407 AD, Saint John Chrysostom died. He was called "Golden-Mouthed" for his eloquent preaching.',
        '9-14': 'On this day in 335 AD, the Exaltation of the Holy Cross was celebrated. This feast honors the discovery of Christ\'s cross.',
        '9-15': 'On this day in 258 AD, Saint Nicomedes was martyred. He was a priest who buried Christian martyrs despite the danger.',
        '9-16': 'On this day in 304 AD, Saint Cornelius and Cyprian were martyred. They were popes who died defending Church unity.',
        '9-17': 'On this day in 1179 AD, Saint Robert Bellarmine was born. He was a Jesuit cardinal who defended the faith against Protestant errors.',
        '9-18': 'On this day in 1663 AD, Saint Joseph of Cupertino died. He was known for levitating during prayer and ecstasies.',
        '9-19': 'On this day in 305 AD, Saint Januarius was commemorated. His blood liquefies miraculously in Naples three times yearly.',
        '9-20': 'On this day in 1846 AD, Saint Andrew Kim Taegon died. He was the first Korean-born priest and martyr.',
        '9-21': 'On this day in 96 AD, Saint Matthew the Apostle died. He was a tax collector who became an evangelist and martyr.',
        '9-22': 'On this day in 530 AD, Saint Thomas of Villanova died. He was known as "the father of the poor" for his extreme charity.',
        '9-23': 'On this day in 1903 AD, Saint Padre Pio was born. He bore the stigmata for 50 years and could read souls.',
        '9-24': 'On this day in 780 AD, Saint Pacifico of San Severino died. He was known for his gift of prophecy and healing.',
        '9-25': 'On this day in 1486 AD, Saint Nicholas of Flue died. He was a Swiss hermit who prevented a civil war through his counsel.',
        '9-26': 'On this day in 258 AD, Saint Cosmas and Damian were martyred. They were twin physicians who treated patients without charge.',
        '9-27': 'On this day in 1550 AD, Saint Vincent de Paul was born. He founded the Vincentians and served the poor in France.',
        '9-28': 'On this day in 935 AD, Saint Wenceslaus died. He was a duke who was murdered by his brother while going to Mass.',
        '9-29': 'On this day in 1569 AD, Saint Michael the Archangel was celebrated. He led the heavenly army against Satan.',
        '9-30': 'On this day in 420 AD, Saint Jerome died. He translated the Bible into Latin (the Vulgate) and lived as a hermit in Bethlehem.',
        '10-1': 'On this day in 1873 AD, Saint Thérèse of Lisieux was born. She was a Carmelite nun who became Doctor of the Church.',
        '10-2': 'On this day in 1264 AD, Saint Guardian Angels was celebrated. This feast honors our personal guardian angels.',
        '10-3': 'On this day in 1226 AD, Saint Francis of Assisi died. He founded the Franciscans and received the stigmata.',
        '10-4': 'On this day in 1582 AD, Saint Francis of Assisi was commemorated. He preached to birds and animals, seeing them as God\'s creatures.',
        '10-5': 'On this day in 1905 AD, Saint Faustina Kowalska was born. She promoted the Divine Mercy devotion and saw visions of Christ.',
        '10-6': 'On this day in 1101 AD, Saint Bruno died. He founded the Carthusian order, combining hermit life with community.',
        '10-7': 'On this day in 1571 AD, Saint Our Lady of the Rosary was celebrated. This feast was established after the Battle of Lepanto.',
        '10-8': 'On this day in 896 AD, Saint Pelagia died. She was an actress who converted and lived as a hermit in men\'s clothing.',
        '10-9': 'On this day in 258 AD, Saint Denis was martyred. He was the first bishop of Paris and was beheaded, then walked carrying his head.',
        '10-10': 'On this day in 644 AD, Saint Paulinus of Nola died. He was a wealthy poet who gave everything to the poor.',
        '10-11': 'On this day in 1962 AD, Saint Pope John XXIII opened the Second Vatican Council, modernizing the Church.',
        '10-12': 'On this day in 1492 AD, Saint Christopher was commemorated. He is patron saint of travelers, traditionally carrying Christ across a river.',
        '10-13': 'On this day in 54 AD, Saint Edward the Confessor died. He was an English king known for his piety and building Westminster Abbey.',
        '10-14': 'On this day in 1066 AD, Saint Callistus I died. He was a pope who was martyred defending the faith.',
        '10-15': 'On this day in 1582 AD, Saint Teresa of Ávila died. She was a mystic and Doctor of the Church who reformed the Carmelites.',
        '10-16': 'On this day in 1582 AD, Saint Margaret Mary Alacoque was born. She promoted devotion to the Sacred Heart of Jesus.',
        '10-17': 'On this day in 107 AD, Saint Ignatius of Antioch was martyred. He wrote letters on his way to Rome, begging Christians not to stop his martyrdom.',
        '10-18': 'On this day in 70 AD, Saint Luke the Evangelist died. He was a physician who wrote the third Gospel and Acts.',
        '10-19': 'On this day in 1646 AD, Saint Isaac Jogues was martyred. He was a Jesuit missionary to North America who survived torture.',
        '10-20': 'On this day in 1775 AD, Saint Paul of the Cross died. He founded the Passionists to meditate on Christ\'s suffering.',
        '10-21': 'On this day in 236 AD, Saint Ursula was martyred. She led 11,000 virgins on pilgrimage and was killed by Huns.',
        '10-22': 'On this day in 1920 AD, Saint Pope John Paul II was born. He helped end communism in Europe and traveled to 129 countries.',
        '10-23': 'On this day in 42 AD, Saint James the Greater died. He was the first apostle martyred, beheaded by King Herod.',
        '10-24': 'On this day in 99 AD, Saint Anthony Mary Claret was born. He founded the Claretians and was archbishop of Cuba.',
        '10-25': 'On this day in 286 AD, Saint Crispin and Crispinian were martyred. They were shoemakers who preached by day and made shoes by night.',
        '10-26': 'On this day in 303 AD, Saint Demetrius was martyred. He was a soldier who converted many and is patron saint of Thessalonica.',
        '10-27': 'On this day in 312 AD, Saint Abraham was commemorated. He was the father of faith who left his homeland for God\'s promise.',
        '10-28': 'On this day in 312 AD, Saint Simon and Jude were martyred. They were apostles who preached in Persia and were killed together.',
        '10-29': 'On this day in 312 AD, Saint Narcissus died. He was a bishop of Jerusalem who lived to age 116 and performed miracles.',
        '10-30': 'On this day in 42 AD, Saint Marcellus was martyred. He was a centurion who converted and was executed for refusing to serve pagan gods.',
        '10-31': 'On this day in 1517 AD, Saint Martin Luther posted his 95 Theses, beginning the Protestant Reformation.',
        '11-1': 'On this day in 1517 AD, Saint All Saints Day was celebrated. This feast honors all known and unknown saints in heaven.',
        '11-2': 'On this day in 998 AD, Saint All Souls Day was established. This feast honors all the faithful departed in purgatory.',
        '11-3': 'On this day in 1639 AD, Saint Martin de Porres died. He was a Dominican lay brother who cared for the poor regardless of race.',
        '11-4': 'On this day in 1584 AD, Saint Charles Borromeo died. He was a cardinal who reformed the clergy during the Protestant Reformation.',
        '11-5': 'On this day in 1582 AD, Saint Elizabeth was commemorated. She was a mother who visited Mary and recognized Jesus as Lord.',
        '11-6': 'On this day in 719 AD, Saint Leonard died. He was a nobleman who became a hermit and is patron saint of prisoners.',
        '11-7': 'On this day in 739 AD, Saint Willibrord died. He was the "Apostle of the Frisians" and first bishop of Utrecht.',
        '11-8': 'On this day in 397 AD, Saint Four Crowned Martyrs died. They were sculptors who refused to make pagan idols.',
        '11-9': 'On this day in 397 AD, Saint Theodore Tiro died. He was a soldier who burned a pagan temple and was martyred.',
        '11-10': 'On this day in 461 AD, Saint Leo the Great died. He was pope who convinced Attila the Hun not to sack Rome.',
        '11-11': 'On this day in 303 AD, Saint Martin of Tours died. He was a soldier who cut his cloak in half to share with a beggar.',
        '11-12': 'On this day in 1623 AD, Saint Josaphat died. He was a bishop who worked for unity between Catholic and Orthodox Churches.',
        '11-13': 'On this day in 1850 AD, Saint Frances Xavier Cabrini was born. She was the first American citizen to be canonized.',
        '11-14': 'On this day in 1716 AD, Saint Lawrence O\'Toole died. He was Archbishop of Dublin who mediated between Irish and English.',
        '11-15': 'On this day in 1280 AD, Saint Albert the Great died. He was a scientist and theologian who taught Thomas Aquinas.',
        '11-16': 'On this day in 1093 AD, Saint Margaret of Scotland died. She was Hungarian-born queen who cared for the poor.',
        '11-17': 'On this day in 375 AD, Saint Gregory Thaumaturgus died. He was called "the Wonder Worker" for his many miracles.',
        '11-18': 'On this day in 1852 AD, Saint Rose Philippine Duchesne died. She was a missionary to Native Americans on the US frontier.',
        '11-19': 'On this day in 1231 AD, Saint Elizabeth of Hungary died. She was a princess who gave her wealth to the poor and died at age 24.',
        '11-20': 'On this day in 1016 AD, Saint Edmund the Martyr died. He was a king who was martyred by Vikings for refusing to renounce Christ.',
        '11-21': 'On this day in 43 AD, Saint Presentation of Mary was celebrated. This feast commemorates Mary being presented in the temple as a child.',
        '11-22': 'On this day in 230 AD, Saint Cecilia was martyred. She is patron saint of musicians and sang to God while dying.',
        '11-23': 'On this day in 99 AD, Saint Clement I died. He was pope who wrote one of the earliest Christian letters after the New Testament.',
        '11-24': 'On this day in 463 AD, Saint Colman of Cloyne died. He was a poet who became a bishop and founded a monastery.',
        '11-25': 'On this day in 258 AD, Saint Catherine of Alexandria was martyred. She was a philosopher who debated 50 pagan scholars.',
        '11-26': 'On this day in 535 AD, Saint Sylvester I died. He was pope during Constantine\'s conversion and built many churches.',
        '11-27': 'On this day in 395 AD, Saint James Intercisus died. He was a Persian official who was martyred for refusing to renounce Christ.',
        '11-28': 'On this day in 739 AD, Saint Stephen the Younger died. He led resistance against iconoclasts and was martyred.',
        '11-29': 'On this day in 1268 AD, Saint Saturninus died. He was a bishop who was dragged by a bull until he died.',
        '11-30': 'On this day in 734 AD, Saint Andrew the Apostle died. He was Peter\'s brother and preached in Greece and Russia.',
        '12-1': 'On this day in 304 AD, Saint Edmund Campion died. He was a Jesuit priest executed in England for celebrating Mass.',
        '12-2': 'On this day in 546 AD, Saint Bibiana died. She was martyred for her faith and is patron saint of hangovers.',
        '12-3': 'On this day in 1552 AD, Saint Francis Xavier died. He was a Jesuit missionary who converted hundreds of thousands in Asia.',
        '12-4': 'On this day in 733 AD, Saint John of Damascus died. He was the last of the Greek Fathers and defended icons.',
        '12-5': 'On this day in 553 AD, Saint Sabbas died. He founded the Great Lavra monastery in Jerusalem, still active today.',
        '12-6': 'On this day in 343 AD, Saint Nicholas of Myra died. He was the real Santa Claus who secretly gave gifts to the poor.',
        '12-7': 'On this day in 43 AD, Saint Ambrose of Milan was born. He baptized Augustine and fought Arian heresy.',
        '12-8': 'On this day in 15 AD, the Immaculate Conception was celebrated. This feast honors Mary being conceived without original sin.',
        '12-9': 'On this day in 1531 AD, Saint Juan Diego died. He saw Our Lady of Guadalupe and his tilma still bears her image.',
        '12-10': 'On this day in 304 AD, Saint Eulalia of Barcelona died. She was martyred at age 13 for refusing to worship Roman gods.',
        '12-11': 'On this day in 384 AD, Saint Pope Damasus I died. He commissioned the Latin Vulgate Bible and beautified Roman catacombs.',
        '12-12': 'On this day in 1531 AD, Our Lady of Guadalupe appeared to Juan Diego. Her image on his tilma converted millions.',
        '12-13': 'On this day in 304 AD, Saint Lucy was martyred. Her eyes were gouged out but she could still see, patron saint of eyesight.',
        '12-14': 'On this day in 1591 AD, Saint John of the Cross died. He was a mystic poet who wrote "Dark Night of the Soul."',
        '12-15': 'On this day in 1348 AD, Saint Virginia Centurione Bracelli died. She cared for abandoned children and the sick in Genoa.',
        '12-16': 'On this day in 1517 AD, Saint Adelaide died. She was a Holy Roman Empress who used her power to help the poor.',
        '12-17': 'On this day in 303 AD, Saint Lazarus was commemorated. Jesus raised him from the dead, and he later became bishop of Marseille.',
        '12-18': 'On this day in 1558 AD, Saint Sebastian was martyred. He was shot with arrows but survived, only to be clubbed to death.',
        '12-19': 'On this day in 401 AD, Saint Pope Anastasius I died. He fought Pelagianism and condemned Origen\'s writings.',
        '12-20': 'On this day in 1084 AD, Saint Dominic of Silos died. He was known for freeing captives and is patron saint of prisoners.',
        '12-21': 'On this day in 303 AD, Saint Thomas the Apostle died. He brought Christianity to India and built churches there.',
        '12-22': 'On this day in 540 AD, Saint Chaeromon died. He was a bishop who fled persecution with his congregation into the desert.',
        '12-23': 'On this day in 553 AD, Saint John of Kanty died. He was a professor who gave his salary to the poor.',
        '12-24': 'On this day in 1 AD, Christmas Eve was celebrated. This night commemorates the birth of Jesus Christ in Bethlehem.',
        '12-25': 'On this day in 1 AD, Christmas was celebrated. This feast celebrates the incarnation of God becoming man in Jesus Christ.',
        '12-26': 'On this day in 26 AD, Saint Stephen the Deacon was martyred. He was the first Christian martyr, stoned while preaching.',
        '12-27': 'On this day in 100 AD, Saint John the Apostle died. He was the beloved disciple who lived to old age and wrote the Gospel of John.',
        '12-28': 'On this day in 20 AD, the Holy Innocents were martyred. King Herod killed all baby boys in Bethlehem trying to kill Jesus.',
        '12-29': 'On this day in 1170 AD, Saint Thomas Becket was martyred. He was Archbishop of Canterbury killed by knights of King Henry II.',
        '12-30': 'On this day in 274 AD, Saint Anysia died. She was a wealthy woman who gave everything to the poor and was martyred.',
        '12-31': 'On this day in 376 AD, Saint Sylvester I died. He was pope during Constantine\'s reign and saw Christianity legalized.'
    };
    
    // Get the fact for today's date, or a default message if not found
    const fact = martyrFacts[dateKey] || `On this day in Christian history, we remember the countless martyrs who gave their lives for Christ. Their courage and faith continue to inspire believers around the world today.`;
    
    // Display the fact with proper formatting
    button3Result.innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin: 10px 0;">
            <h3 style="margin: 0 0 15px 0; color: white;">📅 This Day in Christian History</h3>
            <p style="margin: 0; line-height: 1.6; font-size: 16px; color: white;">${fact}</p>
            <p style="margin: 15px 0 0 0; font-size: 14px; color: white; opacity: 0.9; font-style: italic;">Today: ${today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
    `;
    button3Result.className = 'success';
}

// Add event listeners when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Control Panel loaded successfully');
    
    // You could also add event listeners programmatically instead of using onclick
    // document.getElementById('weatherBtn').addEventListener('click', getWeather);
    // document.getElementById('noteBtn').addEventListener('click', sendNote);
    // document.getElementById('button3Btn').addEventListener('click', runButton3);
});
