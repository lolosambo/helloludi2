<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity]
#[ORM\Table(name: 'user')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private int $id;

    #[ORM\Column(type: 'string', length: 255, unique: true)]
    private string $pseudo;

    #[ORM\Column(type: 'string', length: 255, unique: false)]
    private string $name;

    #[ORM\Column(type: 'string', length: 255, unique: false)]
    private string $firstName;

    #[ORM\Column(type: 'string', length: 255, unique: false)]
    private string $password;

    #[ORM\Column(type: 'string', length: 255, unique: true)]
    private string $email;

    #[ORM\Column(type: 'string', length: 255, unique: false)]
    private string $theme;

    #[ORM\Column(type: 'datetime')]
    private \DateTime $dateInscription;

    #[ORM\Column(type: 'string', length: 255)]
    private string $role;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: Post::class)]
    private Collection $posts;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: Comment::class)]
    private Collection $comments;

    #[ORM\Column(type: 'string', nullable: true)]
    private ?string $resetToken = null;


    public function __construct()
    {
        $this->dateInscription = new \DateTime(); // Initialisation de la date d'inscription
        $this->posts = new ArrayCollection();
        $this->comments = new ArrayCollection();
    }

    // Getters et setters

    public function getId(): int
    {
        return $this->id;
    }

    public function getPseudo(): string
    {
        return $this->pseudo;
    }

    public function setPseudo(string $pseudo): self
    {
        $this->pseudo = $pseudo;
        return $this;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public function getFirstName(): string
    {
        return $this->firstName;
    }

    public function setFirstName(string $firstName): void
    {
        $this->firstName = $firstName;
    }



    public function getPassword(): string
    {
        return $this->password;
    }

    public function setPassword(string $password): void
    {
        $this->password = $password;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setEmail(string $email): self
    {
        $this->email = $email;
        return $this;
    }

    public function getDateInscription(): \DateTime
    {
        return $this->dateInscription;
    }

    public function setDateInscription(\DateTime $dateInscription): self
    {
        $this->dateInscription = $dateInscription;
        return $this;
    }

    public function getRole(): string
    {
        return $this->role;
    }

    public function setRole(string $role): self
    {
        $this->role = $role;
        return $this;
    }

    public function getPosts(): Collection
    {
        return $this->posts;
    }

    public function getComments(): Collection
    {
        return $this->comments;
    }

    public function setComments(Collection $comments): void
    {
        $this->comments = $comments;
    }

    public function getResetToken(): ?string
    {
        return $this->resetToken;
    }

    public function setResetToken(?string $resetToken): self
    {
        $this->resetToken = $resetToken;

        return $this;
    }

    public function getRoles(): array
    {
        return ['ROLE_USER'];
    }

    public function eraseCredentials(): void
    {
        // TODO: Implement eraseCredentials() method.
    }

    public function getUserIdentifier(): string
    {
        return $this->email;
    }

    public function getTheme(): string
    {
        return $this->theme;
    }

    public function setTheme(string $theme): void
    {
        $this->theme = $theme;
    }
}
