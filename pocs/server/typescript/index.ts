
import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = 8080;

function getAboutResponse(clientHost: string) {
    return {
        client: {
            host: clientHost
        },
        server: {
            current_time: Math.floor(Date.now() / 1000),
            services: [
                {
                    name: "facebook",
                    actions: [
                        {
                            name: "new_message_in_group",
                            description: "A new message is posted in the group"
                        },
                        {
                            name: "new_message_inbox",
                            description: "A new private message is received by the user"
                        },
                        {
                            name: "new_like",
                            description: "The user gains a like from one of their messages"
                        }
                    ],
                    reactions: [
                        {
                            name: "like_message",
                            description: "The user likes a message"
                        }
                    ]
                }
            ]
        }
    };
}

// Root route
app.get('/', (req, res) => {
    res.status(200).send('<html><body><h1>Hello, World!</h1></body></html>');
});

// About route
app.get('/about.json', (req, res) => {
    const clientHost = req.ip || req.socket.remoteAddress || '';
    const response = getAboutResponse(clientHost);
    res.status(200).json(response);
});

// Weather route
const apiUrl = "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m";
app.get('/weather', async (req, res) => {
    try {
        const response = await fetch(apiUrl);
        const weatherData = await response.json();
        res.status(200).json(weatherData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).send('<html><body><h1>404 Not Found</h1></body></html>');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
