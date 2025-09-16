This folder contains the frontend feature architecture.

Do not import backend code here. Follow the layer rules:

- components/stateless → no contexts or API imports
- components/containers → state contexts only
- contexts/state → fetching contexts only
- contexts/fetching → API clients only
- api → calls backend routes via the base API client (with validation at boundary)
