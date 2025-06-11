<?php

namespace App\Repository;

use App\Entity\Comment;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Doctrine\ORM\QueryBuilder;

/**
 * @extends ServiceEntityRepository<Comment>
 *
 * @method Comment|null find($id, $lockMode = null, $lockVersion = null)
 * @method Comment|null findOneBy(array $criteria, array $orderBy = null)
 * @method Comment[]    findAll()
 * @method Comment[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class CommentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Comment::class);
    }

    /**
     * Trouve tous les commentaires d'un utilisateur
     */
    public function findByUser(int $userId): array
    {
        return $this->createQueryBuilder('c')
            ->andWhere('c.user = :userId')
            ->setParameter('userId', $userId)
            ->orderBy('c.creationDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve tous les commentaires d'un post (si une relation Post est ajoutée)
     */
    public function findByPost(int $postId): array
    {
        return $this->createQueryBuilder('c')
            ->andWhere('c.post = :postId') // Si tu as une relation vers Post
            ->setParameter('postId', $postId)
            ->orderBy('c.creationDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Méthode pour trouver un commentaire par son contenu (exemple avec un LIKE)
     */
    public function findByContent(string $content): array
    {
        return $this->createQueryBuilder('c')
            ->andWhere('c.content LIKE :content')
            ->setParameter('content', '%'.$content.'%')
            ->orderBy('c.creationDate', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
