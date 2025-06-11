<?php

// src/Entity/Rating.php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use App\Entity\User;
use App\Entity\Post;

#[ORM\Entity]
class Rating
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: Post::class, inversedBy: 'ratings')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Post $post = null;

    #[ORM\Column(type: 'float')]
    private ?float $rating = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId(?int $id): void
    {
        $this->id = $id;
    }

    public function getUser(): ?\App\Entity\User
    {
        return $this->user;
    }

    public function setUser(?\App\Entity\User $user): void
    {
        $this->user = $user;
    }

    public function getPost(): ?\App\Entity\Post
    {
        return $this->post;
    }

    public function setPost(?\App\Entity\Post $post): void
    {
        $this->post = $post;
    }

    public function getRating(): ?float
    {
        return $this->rating;
    }

    public function setRating(?float $rating): void
    {
        $this->rating = $rating;
    }
}
