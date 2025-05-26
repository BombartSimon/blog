# Micro Blog

A simple blog system using microservices architecture with go-micro v5.

<img src=https://github.com/user-attachments/assets/c7c74c36-32da-4120-af88-254d00ecf8c6 height=500px width=auto>


## Services

The project consists of the following microservices:

1. **Users Service**: User management (create, read, update, delete)
2. **Posts Service**: Post management (create, read, delete, list, tag management)
3. **Comments Service**: Comment management (create, read, delete, list)
4. **Web Service**: REST API that uses all other services

## Web Interface (Static UI)

This branch includes a minimalist static web interface for the blog, located in `web/static/`:

- `index.html`: Main feed, create posts, view posts and comments
- `login.html`: User login page
- `signup.html`: User registration page
- `profile.html`: User profile, posts, and comments

You do not need to run a separate static file server. When you run the web service (`web/main.go`), it will serve both the REST API and the web interface (static files) on http://localhost:42096.

Just start the web service as shown below, then open http://localhost:42096 in your browser to use the app.

Authentication and profile features are available via the UI. The static UI interacts with the REST API provided by the web service.

### Tag Features

The blog allows you to:
- Add tags to posts
- Remove tags from posts
- Filter the feed to show posts with a specific tag
- Browse all available tags

## Getting Started

### Prerequisites

- Go 1.24 or higher
- [Micro](https://github.com/micro/micro) v5 (master branch)

To install Micro CLI:

```bash
go install github.com/micro/micro/v5@master
```

Make sure that `$GOPATH/bin` (or `$HOME/go/bin`) is in your `PATH` so you can use the `micro` command.

### Launching Services

You have two options to run all services:

**Option 1: Use Micro CLI**

If you have [Micro](https://github.com/micro/micro) installed, you can run all services at once from the project root:

```bash
micro run --all
```

**Option 2: Use the Makefile (no Micro required)**

You can use the Makefile to run all services in parallel using plain Go:

```bash
make run-all
```

Or run individual services:

```bash
make run-users
make run-posts
make run-comments
make run-web
```

The REST API and web interface will be available at http://localhost:42096

## API Endpoints

### Posts

- `GET /posts`: List all posts
- `GET /posts/:id`: Get a post by ID
- `POST /posts`: Create a new post
  ```json
  {
    "title": "Post title",
    "content": "Post content"
  }
  ```

### Comments

- `GET /comments`: List all comments (optionally filter by `post_id` query param)
- `POST /comments`: Add a comment
  ```json
  {
    "content": "Comment content",
    "post_id": "post_id"
  }
  ```

### Users

- `GET /users`: List all users
- `GET /users/:id`: Get a user by ID
- `POST /users`: Create a new user
  ```json
  {
    "name": "User Name",
    "email": "email@example.com"
  }
  ```
- `POST /signup`: Register a new user (and log in)
  ```json
  {
    "name": "User Name",
    "email": "email@example.com",
    "password": "plaintextpassword"
  }
  ```
- `POST /login`: Log in as a user
  ```json
  {
    "email": "email@example.com",
    "password": "plaintextpassword"
  }
  ```
- `POST /logout`: Log out the current user
- `GET /users/me`: Get the current session user info

### Tags

- `POST /posts/:id/tags`: Add a tag to a post
  ```json
  {
    "tag": "tagname"
  }
  ```
- `DELETE /posts/:id/tags/:tag`: Remove a tag from a post
- `GET /tags`: Get all available tags
- `GET /tags?post_id=:id`: Get tags for a specific post
- `GET /posts/by-tag/:tag`: Get posts with a specific tag

## Project Structure

```
blog/
├── comments/           # Comments service
│   ├── handler/        # Request handlers
│   ├── main.go         # Entry point
│   └── proto/          # Protobuf definitions
├── posts/              # Posts service
│   ├── handler/
│   ├── main.go
│   └── proto/
├── users/              # Users service
│   ├── handler/
│   ├── main.go
│   └── proto/
└── web/                # REST API and static web UI
    ├── main.go         # REST API server
    └── static/         # Static web UI (index.html, login.html, signup.html, profile.html)
```
