<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity]
#[ORM\Table(name: 'post')]
class Post
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $title;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $content;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $image = null;

    #[ORM\Column(type: 'string', length: 255, nullable: false)]
    private ?string $category = null;

    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $creationDate;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $updateDate = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'post')]
    #[ORM\JoinColumn(nullable: false)]
    private UserInterface $user;

    #[ORM\Column(type: 'simple_array', nullable: true)]
    private ?array $likes = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Assert\NotBlank(allowNull: true)]
    private ?string $place = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    #[Assert\NotBlank(allowNull: true)]
    private ?string $personsNumber = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    #[Assert\NotBlank(allowNull: true)]
    private ?string $cookingTime = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Assert\NotBlank(allowNull: true)]
    private ?\DateTimeInterface $date = null;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $averageRating = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $ratingCount = null;

    #[ORM\Column(type: 'boolean', nullable: false)]
    private ?bool $onLine = false;

    #[ORM\OneToMany(mappedBy: 'post', targetEntity: Comment::class)]
    private Collection $comments;

    #[ORM\OneToMany(mappedBy: 'post', targetEntity: Rating::class, cascade: ['remove'])]
    private Collection $ratings;

    public function __construct()
    {
        $this->comments = new ArrayCollection();
        $this->ratings = new ArrayCollection();
    }

    // Getters and setters...

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): self
    {
        $this->title = $title;

        return $this;
    }

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(?string $content): self
    {
        $this->content = $content;

        return $this;
    }

    public function getImage(): ?string
    {
        return $this->image;
    }

    public function setImage(?string $image): self
    {
        $this->image = $image;

        return $this;
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

    public function getUpdateDate(): ?\DateTimeInterface
    {
        return $this->updateDate;
    }

    public function setUpdateDate(?\DateTimeInterface $updateDate): self
    {
        $this->updateDate = $updateDate;

        return $this;
    }

    public function getCategory(): ?string
    {
        return $this->category;
    }

    public function setCategory(?string $category): void
    {
        $this->category = $category;
    }

    public function getPlace(): ?string
    {
        return $this->place;
    }

    public function setPlace(?string $place): void
    {
        $this->place = $place;
    }

    public function getDate(): ?\DateTimeInterface
    {
        return $this->date;
    }

    public function setDate(?\DateTimeInterface $date): void
    {
        $this->date = $date;
    }

    public function getPersonsNumber(): ?string
    {
        return $this->personsNumber;
    }

    public function setPersonsNumber(?string $personsNumber): void
    {
        $this->personsNumber = $personsNumber;
    }

    public function getCookingTime(): ?string
    {
        return $this->cookingTime;
    }

    public function setCookingTime(?string $cookingTime): void
    {
        $this->cookingTime = $cookingTime;
    }

    public function getUser(): UserInterface
    {
        return $this->user;
    }

    public function setUser(UserInterface $user): self
    {
        $this->user = $user;

        return $this;
    }

    public function getLikes(): ?array
    {
        return $this->likes;
    }

    public function setLikes(?array $likes): void
    {
        $this->likes = $likes;
    }

    public function getComments(): Collection
    {
        return $this->comments;
    }

    public function setComments(Collection $comments): void
    {
        $this->comments = $comments;
    }

    public function getAverageRating(): ?float
    {
        return $this->averageRating;
    }

    public function IsOnLine(): ?bool
    {
        return $this->onLine;
    }

    public function setOnLine(?bool $onLine): void
    {
        $this->onLine = $onLine;
    }

    public function setAverageRating(?float $averageRating): self
    {
        $this->averageRating = $averageRating;

        return $this;
    }

    public function getRatingCount(): ?int
    {
        return $this->ratingCount;
    }

    public function setRatingCount(?int $ratingCount): self
    {
        $this->ratingCount = $ratingCount;

        return $this;
    }

    public function getRatings(): Collection
    {
        return $this->ratings;
    }

    public function addRating(Rating $rating): self
    {
        if (!$this->ratings->contains($rating)) {
            $this->ratings->add($rating);
            $rating->setPost($this);
        }

        return $this;
    }

    public function removeRating(Rating $rating): self
    {
        if ($this->ratings->removeElement($rating)) {
            if ($rating->getPost() === $this) {
                $rating->setPost(null);
            }
        }

        return $this;
    }
}

