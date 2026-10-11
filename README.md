# Demo with Claude Code

This project demonstrates a Flask web application created with assistance from Claude Code.

## Project Overview

A simple Flask web application that showcases:
- Basic Flask routing and templating
- Static file serving
- Docker containerization
- MLOps project structure

## Features

- Home page with welcome message
- Static file serving (CSS, images)
- Template rendering with Jinja2
- Docker support for easy deployment
- Logging setup

## Project Structure

```
Demo_with_claude_code/
├── app.py              # Main Flask application
├── wsgi.py            # WSGI entry point for production
├── requirements.txt   # Python dependencies
├── Dockerfile        # Docker configuration
├── docker-compose.yml # Docker Compose configuration
├── templates/        # HTML templates
│   └── index.html    # Main template
├── static/           # Static assets
│   └── style.css     # CSS styles
├── data/             # Data directory
├── .gitignore       # Git ignore rules
└── README.md        # This file
```

## Prerequisites

- Python 3.8+
- Docker (optional, for containerization)
- Git

## Installation

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/sumitjain1212/Demo_with_claude_code.git
   cd Demo_with_claude_code
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the application:
   ```bash
   python app.py
   ```

5. Open your browser and navigate to `http://localhost:5000`

### Docker

1. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

2. The application will be available at `http://localhost:5000`

## Usage

- The home page (`/`) displays a welcome message
- Static files are served from the `/static` directory
- Application logs are written to `flask.log`

## Configuration

- Environment variables can be set in `.env` file (not included in repo)
- Logging configuration is in `app.py`
- Docker settings are in `Dockerfile` and `docker-compose.yml`

## Development

This project was created with assistance from Claude Code. It follows best practices for Flask development including:

- Proper project structure
- Environment variable management
- Comprehensive .gitignore file
- Docker containerization
- Logging setup

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Created with Claude Code assistance
- Flask framework
- Docker community