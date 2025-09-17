from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import time
import requests

def get_about_response(client_host):
    return {
        "client": {
            "host": client_host
        },
        "server": {
            "current_time": int(time.time()),
            "services": [{
                "name": "facebook",
                "actions": [
                    {
                        "name": "new_message_in_group",
                        "description": "A new message is posted in the group"
                    },
                    {
                        "name": "new_message_inbox",
                        "description": "A new private message is received by the user"
                    },
                    {
                        "name": "new_like",
                        "description": "The user gains a like from one of their messages"
                    }
                ],
                "reactions": [
                    {
                        "name": "like_message",
                        "description": "The user likes a message"
                    }
                ]
            }]
        }
    }

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path in routes:
            routes[self.path](self)
        else:
            get_404(self)

def get_about(self=SimpleHandler):
    response = get_about_response(self.client_address[0])
    self.send_response(200)
    self.send_header('Content-type', 'application/json')
    self.end_headers()
    self.wfile.write(json.dumps(response).encode())

def get_root(self=SimpleHandler):
    self.send_response(200)
    self.send_header('Content-type', 'text/html')
    self.end_headers()
    self.wfile.write(b"<html><body><h1>Hello, World!</h1></body></html>")

apiUrl = "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m"

def get_weather(self=SimpleHandler):
    response = requests.get(apiUrl)
    weather_data = response.json()
    self.send_response(200)
    self.send_header('Content-type', 'application/json')
    self.end_headers()
    self.wfile.write(json.dumps(weather_data).encode())

def get_404(self=SimpleHandler):
    self.send_response(404)
    self.send_header('Content-type', 'text/html')
    self.end_headers()
    self.wfile.write(b"<html><body><h1>404 Not Found</h1></body></html>")

routes = {
    '/about.json': get_about,
    '/': get_root,
    '/weather': get_weather
}

def run(server_class=HTTPServer, handler_class=SimpleHandler, port=8080):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"Serving HTTP on port {port}...")
    httpd.serve_forever()

if __name__ == '__main__':
    run()
