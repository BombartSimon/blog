package main

import (
	"context"
	"log"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"go-micro.dev/v5"
	"golang.org/x/crypto/bcrypt"

	commentProto "github.com/micro/blog/comments/proto"
	postProto "github.com/micro/blog/posts/proto"
	userProto "github.com/micro/blog/users/proto"
)

func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func checkPasswordHash(password, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

func main() {

	service := micro.NewService(
		micro.Name("rest-api"),
	)
	service.Init()

	postClient := postProto.NewPostsService("posts", service.Client())
	commentClient := commentProto.NewCommentsService("comments", service.Client())
	userClient := userProto.NewUsersService("users", service.Client())

	log.Println("Starting REST API server on port 42096...")

	router := gin.Default()

	sessionStore := cookie.NewStore([]byte("secret"))
	router.Use(sessions.Sessions("session", sessionStore))

	// Middleware to set user info in context
	router.Use(func(c *gin.Context) {
		sess := sessions.Default(c)
		userID := sess.Get("user_id")
		userName := sess.Get("user_name")
		if userID != nil && userName != nil {
			c.Set("user_id", userID)
			c.Set("user_name", userName)
		}
		c.Next()
	})

	// === Posts endpoints ===
	router.GET("/posts", func(c *gin.Context) {
		resp, err := postClient.List(context.Background(), &postProto.ListRequest{
			Page:  1,
			Limit: 10,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, resp)
	})

	router.GET("/posts/:id", func(c *gin.Context) {
		id := c.Param("id")
		resp, err := postClient.Read(context.Background(), &postProto.ReadRequest{
			Id: id,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, resp)
	})

	router.POST("/posts", func(c *gin.Context) {
		var req struct {
			Title   string `json:"title"`
			Content string `json:"content"`
		}
		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		userID, _ := c.Get("user_id")
		userName, _ := c.Get("user_name")
		if userID == nil || userName == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "login required"})
			return
		}
		resp, err := postClient.Create(context.Background(), &postProto.CreateRequest{
			Title:      req.Title,
			Content:    req.Content,
			AuthorId:   userID.(string),
			AuthorName: userName.(string),
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, resp)
	})

	// === Comments endpoints ===
	router.GET("/comments", func(c *gin.Context) {
		postID := c.Query("post_id")
		resp, err := commentClient.List(context.Background(), &commentProto.ListRequest{
			PostId: postID,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, resp)
	})

	router.POST("/comments", func(c *gin.Context) {
		var req struct {
			Content string `json:"content"`
			PostId  string `json:"post_id"`
		}
		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		userID, _ := c.Get("user_id")
		userName, _ := c.Get("user_name")
		if userID == nil || userName == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "login required"})
			return
		}
		resp, err := commentClient.Create(context.Background(), &commentProto.CreateRequest{
			Content:    req.Content,
			AuthorId:   userID.(string),
			AuthorName: userName.(string),
			PostId:     req.PostId,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, resp)
	})

	// === Users endpoints ===
	router.GET("/users", func(c *gin.Context) {
		resp, err := userClient.List(context.Background(), &userProto.ListRequest{
			Page:  1,
			Limit: 10,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, resp)
	})

	router.GET("/users/:id", func(c *gin.Context) {
		id := c.Param("id")
		resp, err := userClient.Read(context.Background(), &userProto.ReadRequest{
			Id: id,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, resp)
	})

	router.POST("/users", func(c *gin.Context) {
		var req struct {
			Name  string `json:"name"`
			Email string `json:"email"`
		}

		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		resp, err := userClient.Create(context.Background(), &userProto.CreateRequest{
			Name:  req.Name,
			Email: req.Email,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, resp)
	})

	// Signup endpoint
	router.POST("/signup", func(c *gin.Context) {
		var req struct {
			Name     string `json:"name"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}

		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if req.Name == "" || req.Email == "" || req.Password == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "all fields required"})
			return
		}
		pwHash, err := hashPassword(req.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
			return
		}
		resp, err := userClient.Create(context.Background(), &userProto.CreateRequest{
			Name:     req.Name,
			Email:    req.Email,
			Password: pwHash,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		sess := sessions.Default(c)
		sess.Set("user_id", resp.User.Id)
		sess.Set("user_name", resp.User.Name)
		sess.Save()
		c.JSON(http.StatusCreated, gin.H{"user": resp.User})
	})

	// Login endpoint
	router.POST("/login", func(c *gin.Context) {
		var req struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		// Find user by email
		usersResp, err := userClient.List(context.Background(), &userProto.ListRequest{Page: 1, Limit: 1000})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		var found *userProto.User

		for _, u := range usersResp.Users {
			if u.Email == req.Email {
				found = u
				break
			}
		}
		if found == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}
		// Check password
		rec, err := userClient.Read(context.Background(), &userProto.ReadRequest{Id: found.Id})
		if err != nil || rec.User == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}
		if !checkPasswordHash(req.Password, rec.User.Password) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}
		sess := sessions.Default(c)
		sess.Set("user_id", found.Id)
		sess.Set("user_name", found.Name)
		sess.Save()
		c.JSON(http.StatusOK, gin.H{"user": found})
	})

	// Logout endpoint
	router.POST("/logout", func(c *gin.Context) {
		sess := sessions.Default(c)
		sess.Clear()
		sess.Save()
		c.JSON(http.StatusOK, gin.H{"message": "logged out"})
	})

	// Session info endpoint for frontend
	router.GET("/users/me", func(c *gin.Context) {
		userID, _ := c.Get("user_id")
		userName, _ := c.Get("user_name")
		if userID == nil || userName == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"user": nil})
			return
		}
		c.JSON(http.StatusOK, gin.H{"user": gin.H{"id": userID, "name": userName}})
	})

	// Serve all static files (css, js, etc.) from /static
	router.Static("/static", "./static")

	// Serve static index.html at root
	router.GET("/", func(c *gin.Context) {
		c.File("./static/index.html")
	})

	// Serve static login and signup pages
	router.GET("/login.html", func(c *gin.Context) {
		c.File("./static/login.html")
	})
	router.GET("/signup.html", func(c *gin.Context) {
		c.File("./static/signup.html")
	})

	// Serve user profile page at /@:username
	router.GET("/@:username", func(c *gin.Context) {
		c.File("./static/profile.html")
	})

	if err := router.Run(":42096"); err != nil {
		log.Fatal("Failed to run Gin server:", err)
	}
}
