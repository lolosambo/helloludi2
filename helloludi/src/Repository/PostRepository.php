<?php

// src/Repository/PostRepository.php
namespace App\Repository;

use App\Entity\Post;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Doctrine\ORM\QueryBuilder;

/**
 * @extends ServiceEntityRepository<Post>
 *
 * @method Post|null find($id, $lockMode = null, $lockVersion = null)
 * @method Post|null findOneBy(array $criteria, array $orderBy = null)
 * @method Post[]    findAll()
 * @method Post[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class PostRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Post::class);
    }

    /**
     * Méthode pour trouver tous les post d'un utilisateur
     * @param int $userId
     * @return Post[]
     */
    public function findByUser(int $userId): array
    {
        return $this->createQueryBuilder('p')
            ->where('p.user = :userId')
            ->setParameter('userId', $userId)
            ->andWhere("p.onLine != :onLine")
            ->setParameter("onLine", false)
            ->orderBy('p.creationDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function find4LastPosts(): array
    {
        return $this->createQueryBuilder('p')
            ->where("p.category != :whoAmI ")
            ->setParameter("whoAmI", "whoAmI")
            ->andWhere("p.onLine != :onLine")
            ->setParameter("onLine", false)
            ->orderBy('p.creationDate', 'DESC')
            ->setMaxResults(4)
            ->getQuery()
            ->getResult();
    }

    public function findBestRecipes()
    {
        return $this->createQueryBuilder('p')
            ->where('p.category = :recipe')
            ->setParameter('recipe',"recipe")
            ->andWhere("p.onLine != :onLine")
            ->setParameter("onLine", false)
            ->orderBy('p.averageRating', 'DESC')
            ->orderBy('p.ratingCount', 'DESC')
            ->setMaxResults(5)
            ->getQuery()
            ->getResult();
    }

    /**
     * Méthode pour trouver tous les post d'un utilisateur
     * @param string $category
     * @return Post[]
     */
    public function findByCategory(string $category): array
    {
        return $this->createQueryBuilder('p')
            ->where('p.category = :category')
            ->setParameter('category', $category)
            ->andWhere("p.onLine != :onLine")
            ->setParameter("onLine", false)
            ->orderBy('p.creationDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Méthode pour trouver un post par son titre
     * @param string $title
     * @return Post|null
     */
    public function findOneByTitle(string $title): ?Post
    {
        return $this->createQueryBuilder('p')
            ->andWhere('p.title = :title')
            ->setParameter('title', $title)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Exemple de requête personnalisée avec critères multiples
     */
    public function findRecentPosts(?int $limit = 10): array
    {
        return $this->createQueryBuilder('p')
            ->where("p.onLine != :onLine")
            ->setParameter("onLine", false)
            ->orderBy('p.creationDate', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Exemple de requête personnalisée avec `QueryBuilder`
     */
    public function customQueryExample(): QueryBuilder
    {
        return $this->createQueryBuilder('p')
            ->where('p.content LIKE :keyword')
            ->setParameter('keyword', '%Symfony%')
            ->orderBy('p.creationDate', 'DESC');
    }

    public function findUnpublishedPosts(): array
    {
        return $this->createQueryBuilder('p')
            ->where("p.onLine != :onLine")
            ->setParameter("onLine", true)
            ->orderBy('p.creationDate', 'DESC')
            ->getQuery()
            ->getResult();
    }
}

