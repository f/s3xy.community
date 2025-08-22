# s3xy.community

> Community-driven Tesla S3XY button scenarios and feature combinations

[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue)](https://f.github.io/s3xy.community)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/f/s3xy.community/pulls)

## Overview

**S3XY Community** is a community-driven, single-page website showcasing creative button scenarios for Tesla's S3XY Buttons accessory. It features both custom scenarios (creative combinations) and raw button features, allowing Tesla owners to discover, share, and implement sophisticated button configurations.

## Quick Start

### View Online

Visit the live site: [https://f.github.io/s3xy.community](https://f.github.io/s3xy.community)

### Run Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/f/s3xy.community.git
   cd s3xy.community
   ```

2. **Install Jekyll dependencies**
   ```bash
   bundle install
   ```

3. **Run the local server**
   ```bash
   bundle exec jekyll serve
   ```

4. **Open in browser**
   ```
   http://localhost:4000/s3xy.community
   ```

## Data Format

### Custom Scenarios (`_data/scenarios.json`)

Community-created button combinations with different actions for each press type:

```json
{
  "scenarios": [
    {
      "id": "winter-morning",
      "name": "Winter Morning Mode",
      "description": "Perfect for cold winter mornings",
      "author": "community",
      "supportedModels": ["model 3", "model y"],
      "tags": ["comfort", "winter"],
      "actions": {
        "single_press": {
          "name": "Quick Warm-Up",
          "description": "Start climate control",
          "steps": [
            {
              "feature": "Climate On"
            },
            {
              "delay": 2
            },
            {
              "feature": "Seat Heater Driver"
            }
          ]
        },
        "double_press": { ... },
        "long_press": { ... }
      }
    }
  ]
}
```

## Contributing

We welcome contributions! Here's how you can help:

### Adding Custom Scenarios

To contribute a new creative button scenario:

1. Fork the repository
2. Edit `_data/scenarios.json` to add your scenario
3. Include:
   - Unique ID (kebab-case)
   - Descriptive name
   - Clear description
   - Your username as author
   - Supported Tesla models
   - Relevant tags
   - Actions for single, double, and long press
   - Each action should have steps that can be either:
     - A feature step: `{"feature": "Feature Name", "note": "optional"}`
     - A delay step: `{"delay": 2}` (in seconds)
   - **IMPORTANT**: Only use feature names that exist in `_data/features.json`
4. Test locally to ensure everything works
5. Submit a pull request with a clear description

Available features include:
- Climate: `Keep Climate On`, `Dog Mode`, `Camp Mode`, `Fan speed` controls, `Defog/Defrost`
- Seats: `Front Left Seat Heating/ Cooling`, `All Heaters Off`
- Access: `Lock`, `Unlock`, `Trunk`, `Frunk`, `Glovebox`
- Driving: `Chill`, `Sport`, Regen settings (`0%`, `25%`, `50%`, `75%`, `100%`)
- Media: `Volume Up/Down`, `Next Song`, `Previous Song`, `Play / Pause / Mute`
- Safety: `Hazard Lights`, Various honk options
- And many more in `_data/features.json`

Example scenario structure:
```json
{
  "id": "your-scenario-id",
  "name": "Your Scenario Name",
  "description": "What this scenario does",
  "author": "YourGitHubUsername",
  "supportedModels": ["model 3", "model y"],
  "tags": ["tag1", "tag2"],
  "actions": {
    "single_press": { ... },
    "double_press": { ... },
    "long_press": { ... }
  }
}
```

### Adding/Updating Features

To add or update raw button features:

1. Fork the repository
2. Edit `_data/features.json` with your changes
3. Test locally to ensure everything works
4. Submit a pull request with a clear description

### Reporting Issues

Found a bug or have a suggestion? [Open an issue](https://github.com/f/s3xy.community/issues)

### Development

To run the site locally for development:

1. Install dependencies:
   ```bash
   bundle install
   ```
2. Run Jekyll server:
   ```bash
   bundle exec jekyll serve --watch
   ```
3. Open http://localhost:4000/s3xy.community in your browser

#### Updating Features Data

The script automatically fetches the latest button features data from the official website:

```bash
node scripts/convert-data-to-features.js
```

This will:
- Fetch the latest data from `https://www.enhauto.com/pages/buttons-functions`
- Extract `window.yearNameCombos` (Tesla model/year combinations)
- Extract `window.quizFunctionData` (button features and categories)
- Create/update `_data/features.json` with all current button features

**Alternative Usage (if website access is blocked):**

If the website is protected by Cloudflare or you want to use a local HTML file:

```bash
# First, save the webpage manually from your browser
# Then run with the local file:
node scripts/convert-data-to-features.js path/to/saved-page.html
```

**Note:** The script automatically handles gzip compression and includes proper browser headers to fetch real-time data from the website.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Tesla S3XY Buttons community for scenario data
- Tesla owners for testing and feedback
- Contributors who help maintain the scenario list

## Contact

- GitHub Issues: [Report bugs or request features](https://github.com/f/s3xy.community/issues)
- Pull Requests: [Contribute scenarios or improvements](https://github.com/f/s3xy.community/pulls)

---

**Note:** This project is not affiliated with Tesla, Inc. or Enhauto. This is a third-party community-driven project.
