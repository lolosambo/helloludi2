<?php

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @method User|null find($id, $lockMode = null, $lockVersion = null)
 * @method User|null findOneBy(array $criteria, array $orderBy = null)
 * @method User[]    findAll()
 * @method User[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class UserRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    // Exemple de méthode personnalisée pour trouver un utilisateur par son pseudo
    public function findByPseudo(string $pseudo): ?User
    {
        return $this->createQueryBuilder('u')
            ->andWhere('u.pseudo = :pseudo')
            ->setParameter('pseudo', $pseudo)
            ->getQuery()
            ->getOneOrNullResult();
    }

    // Exemple de méthode personnalisée pour récupérer tous les utilisateurs inscrits après une certaine date
    public function findByInscriptionDate(\DateTime $date): array
    {
        return $this->createQueryBuilder('u')
            ->andWhere('u.dateInscription > :date')
            ->setParameter('date', $date)
            ->orderBy('u.dateInscription', 'ASC')
            ->getQuery()
            ->getResult();
    }

    // Exemple de méthode pour rechercher des utilisateurs par rôle
    public function findByRole(string $role): array
    {
        return $this->createQueryBuilder('u')
            ->andWhere('u.role = :role')
            ->setParameter('role', $role)
            ->getQuery()
            ->getResult();
    }
}

