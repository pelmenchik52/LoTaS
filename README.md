# LoTaS
Very usefull app for managing transport systems
Create very smart team 

## CI/CD
This project uses GitHub Actions for continuous integration and deployment.

### CI Workflow
- **Triggers**: Push and pull requests to `main` or `master` branches
- **Jobs**:
  - Build backend (.NET 8)
  - Build frontend (React/Vite)
  - Build Docker images
  - Validate Docker Compose configuration

### CD Workflow
- **Triggers**: Successful CI runs or direct pushes to `main`/`master`
- **Jobs**:
  - Build and push Docker images to Docker Hub
  - Requires `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets

To set up deployment:
1. Create a Docker Hub account
2. Add repository secrets in GitHub:
   - `DOCKERHUB_USERNAME`: Your Docker Hub username
   - `DOCKERHUB_TOKEN`: Your Docker Hub access token
