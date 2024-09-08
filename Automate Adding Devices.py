import csv
import requests

# Chirpstack API settings
chirpstack_url = "http://localhost:8080"  # Replace with your Chirpstack URL
api_token = "your_api_token"  # Replace with your Chirpstack API token

# Function to add device
def add_device(device):
    url = f"{chirpstack_url}/devices"
    headers = {
        'Grpc-Metadata-Authorization': f'Bearer {api_token}',
        'Content-Type': 'application/json'
    }
    data = {
        "device": {
            "name": device["device_name"],
            "dev_eui": device["device_eui"],
            "profile_id": device["device_profile_id"],
            "application_id": "1"  # Replace with your application ID if needed
        }
    }
    
    response = requests.post(url, json=data, headers=headers)
    if response.status_code == 201:
        print(f"Successfully added device {device['device_name']}")
    else:
        print(f"Failed to add device {device['device_name']}: {response.text}")

# Read devices from CSV and add them
with open('devices.csv', 'r') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        add_device(row)

