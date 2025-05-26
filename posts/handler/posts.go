package handler

import (
	"context"
	"encoding/json"
	"sort"
	"time"

	"github.com/google/uuid"
	pb "github.com/micro/blog/posts/proto"
	"go-micro.dev/v5/store"
)

type Handler struct{}

func New() *Handler {
	return &Handler{}
}

var postStore = store.DefaultStore

func (h *Handler) Create(ctx context.Context, req *pb.CreateRequest, res *pb.CreateResponse) error {
	post := &pb.Post{
		Id:         uuid.New().String(),
		Title:      req.Title,
		Content:    req.Content,
		AuthorId:   req.AuthorId,
		AuthorName: req.AuthorName,
		CreatedAt:  time.Now().Unix(),
		UpdatedAt:  time.Now().Unix(),
	}

	// Extract first URL and fetch link preview
	url := extractFirstURL(req.Content)
	if url != "" {
		title, desc, image, err := fetchLinkPreview(url)
		if err == nil {
			post.LinkPreview = &pb.LinkPreview{
				Url:         url,
				Title:       title,
				Description: desc,
				Image:       image,
			}
		}
	}

	res.Post = post

	// Save to store
	b, err := json.Marshal(post)
	if err == nil {
		_ = postStore.Write(&store.Record{Key: "post-" + post.Id, Value: b})
	}

	return nil
}

func (h *Handler) Read(ctx context.Context, req *pb.ReadRequest, res *pb.ReadResponse) error {
	rec, err := postStore.Read("post-" + req.Id)
	if err == nil && len(rec) > 0 {
		var post pb.Post
		if err := json.Unmarshal(rec[0].Value, &post); err == nil {
			res.Post = &post
			return nil
		}
	}
	res.Post = nil
	return nil
}

func (h *Handler) Update(ctx context.Context, req *pb.UpdateRequest, res *pb.UpdateResponse) error {
	rec, err := postStore.Read("post-" + req.Id)
	if err != nil || len(rec) == 0 {
		res.Post = nil
		return nil
	}
	var post pb.Post
	if err := json.Unmarshal(rec[0].Value, &post); err != nil {
		res.Post = nil
		return nil
	}
	post.Title = req.Title
	post.Content = req.Content
	b, err := json.Marshal(&post)
	if err == nil {
		_ = postStore.Write(&store.Record{Key: "post-" + post.Id, Value: b})
	}
	res.Post = &post
	return nil
}

func (h *Handler) Delete(ctx context.Context, req *pb.DeleteRequest, res *pb.DeleteResponse) error {
	_ = postStore.Delete("post-" + req.Id)
	return nil
}

func (h *Handler) List(ctx context.Context, req *pb.ListRequest, res *pb.ListResponse) error {
	rec, err := postStore.Read("post-", store.ReadPrefix())
	if err == nil && len(rec) > 0 {
		var loadedPosts []*pb.Post
		for _, r := range rec {
			var p pb.Post
			if err := json.Unmarshal(r.Value, &p); err == nil {
				loadedPosts = append(loadedPosts, &p)
			}
		}
		// Sort posts by CreatedAt descending (reverse chronological)
		if len(loadedPosts) > 1 {
			sort.Slice(loadedPosts, func(i, j int) bool {
				return loadedPosts[i].CreatedAt > loadedPosts[j].CreatedAt
			})
		}
		res.Posts = loadedPosts
		res.Total = int32(len(loadedPosts))
		return nil
	}
	res.Posts = nil
	res.Total = 0
	return nil
}

func (h *Handler) TagPost(ctx context.Context, req *pb.TagPostRequest, res *pb.TagPostResponse) error {
	if req.PostId == "" || req.Tag == "" {
		return nil
	}

	rec, err := postStore.Read("post-" + req.PostId)
	if err != nil || len(rec) == 0 {
		return nil
	}

	var post pb.Post
	if err := json.Unmarshal(rec[0].Value, &post); err != nil {
		return nil
	}

	// Initialize tags slice if it doesn't exist
	if post.Tags == nil {
		post.Tags = []string{}
	}

	// Check if tag already exists for this post
	for _, tag := range post.Tags {
		if tag == req.Tag {
			// Tag already exists, return the post as is
			res.Post = &post
			return nil
		}
	}

	// Add the new tag
	post.Tags = append(post.Tags, req.Tag)
	post.UpdatedAt = time.Now().Unix()

	// Save the updated post
	b, err := json.Marshal(&post)
	if err == nil {
		_ = postStore.Write(&store.Record{Key: "post-" + post.Id, Value: b})
	}

	res.Post = &post
	return nil
}

func (h *Handler) UntagPost(ctx context.Context, req *pb.UntagPostRequest, res *pb.UntagPostResponse) error {
	if req.PostId == "" || req.Tag == "" {
		return nil
	}

	rec, err := postStore.Read("post-" + req.PostId)
	if err != nil || len(rec) == 0 {
		return nil
	}

	var post pb.Post
	if err := json.Unmarshal(rec[0].Value, &post); err != nil {
		return nil
	}

	if len(post.Tags) == 0 {
		res.Post = &post
		return nil
	}

	updatedTags := []string{}
	for _, tag := range post.Tags {
		if tag != req.Tag {
			updatedTags = append(updatedTags, tag)
		}
	}

	// Update the post only if tags were changed
	if len(updatedTags) != len(post.Tags) {
		post.Tags = updatedTags
		post.UpdatedAt = time.Now().Unix()

		// Save the updated post
		b, err := json.Marshal(&post)
		if err == nil {
			_ = postStore.Write(&store.Record{Key: "post-" + post.Id, Value: b})
		}
	}

	res.Post = &post
	return nil
}

func (h *Handler) ListTags(ctx context.Context, req *pb.ListTagsRequest, res *pb.ListTagsResponse) error {
	// If postId is specified, get tags for that specific post
	if req.PostId != "" {
		rec, err := postStore.Read("post-" + req.PostId)
		if err != nil || len(rec) == 0 {
			return nil
		}

		var post pb.Post
		if err := json.Unmarshal(rec[0].Value, &post); err != nil {
			return nil
		}

		res.Tags = post.Tags
		return nil
	}

	// Otherwise, collect all unique tags across all posts
	allTags := make(map[string]struct{})

	rec, err := postStore.Read("post-", store.ReadPrefix())
	if err != nil || len(rec) == 0 {
		return nil
	}

	for _, r := range rec {
		var post pb.Post
		if err := json.Unmarshal(r.Value, &post); err == nil {
			for _, tag := range post.Tags {
				allTags[tag] = struct{}{}
			}
		}
	}

	// Convert map keys to slice
	uniqueTags := make([]string, 0, len(allTags))
	for tag := range allTags {
		uniqueTags = append(uniqueTags, tag)
	}

	// Sort tags alphabetically for consistent output
	sort.Strings(uniqueTags)

	res.Tags = uniqueTags
	return nil
}
