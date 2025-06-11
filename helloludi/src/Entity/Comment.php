<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use App\Repository\CommentRepository;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity]
#[ORM\Table(name: 'comments')]
class Comment
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'text')]
    private string $content;

    #[ORM\ManyToOne(targetEntity: Post::class, inversedBy: 'comments')]
    #[ORM\JoinColumn(nullable: false)]
    private Post $post;

    #[ORM\Column(type: 'string', length: 255, nullable: false)]
    private ?string $pseudo = "Inconnu";

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'replies')]
    private $parent;

    #[ORM\OneToMany(mappedBy: 'parent', targetEntity: self::class, cascade: ['remove'])]
    private $replies;


    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $creationDate;

    public function __construct()
    {
        $this->replies = new ArrayCollection();
    }

    // Getters and setters...

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getContent(): string
    {
        return $this->content;
    }

    public function setContent(string $content): self
    {
        $this->content = $content;

        return $this;
    }

    public function getPseudo(): ?string
    {
        return $this->pseudo;
    }

    public function setPseudo(?string $pseudo): void
    {
        $this->pseudo = $pseudo;
    }


    public function getCreationDate(): \DateTimeInterface
    {
        return $this->creationDate;
    }

    public function setCreationDate(\DateTimeInterface $creationDate): self
    {
        $this->creationDate = $creationDate;

        return $this;
    }

    public function getPost(): Post
    {
        return $this->post;
    }

    public function setPost(Post $post): void
    {
        $this->post = $post;
    }

    public function getParent(): ?self
    {
        return $this->parent;
    }

    public function setParent(?self $parent): self
    {
        $this->parent = $parent;

        return $this;
    }

    /**
     * @return Collection<int, self>
     */
    public function getReplies(): Collection
    {
        return $this->replies;
    }
}
