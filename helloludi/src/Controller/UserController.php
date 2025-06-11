<?php

namespace App\Controller;

use App\Entity\User;
use App\Form\ProfileType;
use App\Form\UserType;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;

class UserController extends AbstractController
{
    // Liste de tous les utilisateurs
    #[Route('/users', name: 'user_index')]
    public function index(UserRepository $userRepository): Response
    {
        $users = $userRepository->findAll();
        return $this->render('user/register.html.twig', [
            'users' => $users,
        ]);
    }

    // Inscription d'un nouvel utilisateur
    #[Route('/user/new', name: 'user_new')]
    public function new(Request $request, EntityManagerInterface $em, UserPasswordHasherInterface $passwordHasher): Response
    {
        $user = new User();
        $form = $this->createForm(UserType::class, $user);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            // Hashage du mot de passe
            $hashedPassword = $passwordHasher->hashPassword($user, $user->getPassword());
            $user->setPassword($hashedPassword);
            $user->setName($form->get('name')->getData());
            $user->setFirstName($form->get('firstName')->getData());
            $user->setTheme($form->get('theme')->getData());

            // Sauvegarde de l'utilisateur en base de données
            $em->persist($user);
            $em->flush();

            $this->addFlash('success', 'User created successfully!');

            return $this->redirectToRoute('user_index');
        }

        return $this->render('user/new.html.twig', [
            'form' => $form->createView(),
        ]);
    }

    // Mise à jour d'un utilisateur
    #[Route('/user/{id}/edit', name: 'user_edit')]
    public function edit(
        Request $request,
        User $user,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $passwordHasher
    ): Response
    {
        $form = $this->createForm(ProfileType::class, $user);
        $form->get('email')->setData($user->getEmail());
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $user->setEmail($form->get('email')->getData());
            $user->setName($form->get('name')->getData());
            $user->setFirstName($form->get('firstName')->getData());
            $user->setTheme($form->get('theme')->getData());
            $em->flush();

            $this->addFlash('success', 'Votre profile a bien été mis à jour');

            return $this->redirectToRoute('user_edit', ["id" => $user->getId()]);
        }

        return $this->render('user/profile.html.twig', [
            'form' => $form->createView(),
            'user' => $user,
        ]);
    }

    // Suppression d'un utilisateur
    #[Route('/user/{id}/delete', name: 'user_delete')]
    public function delete(Request $request, User $user, EntityManagerInterface $em): Response
    {
        if ($this->isCsrfTokenValid('delete' . $user->getId(), $request->get('_token'))) {
            // Suppression de l'utilisateur
            $em->remove($user);
            $em->flush();

            $this->addFlash('success', 'User deleted successfully!');
        }

        return $this->redirectToRoute('user_index');
    }

    #[Route('/forgot/password', name: 'forgot_password')]
    public function forgotPassword(
        Request $request,
        EntityManagerInterface $em,
        MailerInterface $mailer
    ): Response
    {
        if ($request->isMethod('POST')) {
            $email = $request->request->get('email');

            // Logique : vérifier si l'utilisateur existe
            $user = $em->getRepository(User::class)->findOneBy(['email' => $email]);

            if ($user) {
                // Générer un jeton de réinitialisation
                $token = bin2hex(random_bytes(32));
                $user->setResetToken($token);
                $em->flush();

                // Envoyer un e-mail avec le lien de réinitialisation
                $resetLink = $request->getSchemeAndHttpHost() .
                    $this->generateUrl('app_password_reset', ['token' => $token], true);

                $email = (new Email())
                    ->from('contact@helloludi.fr')
                    ->to($user->getEmail())
                    ->subject('Réinitialisation de votre mot de passe HelloLudi')
                    ->text("Voici votre lien de réinitialisation pour le blog HelloLudi.fr : $resetLink");

                $mailer->send($email);

                $this->addFlash('success', 'Un e-mail a été envoyé pour réinitialiser votre mot de passe.');
            } else {
                $this->addFlash('danger', 'Aucun utilisateur trouvé avec cet e-mail.');
            }
        }

        return $this->render('password_reset/forgot.html.twig');
    }

    #[Route('/password/reset/{token}', name: 'app_password_reset')]
    public function resetPassword(
        Request $request,
        string $token,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $passwordHasher
    ): Response
    {
        // Vérifier le jeton
        $user = $em->getRepository(User::class)->findOneBy(['resetToken' => $token]);

        if (!$user) {
            throw $this->createNotFoundException('Jeton invalide.');
        }

        if ($request->isMethod('POST')) {
            $newPassword = $request->request->get('password');
            $hashedPassword = $passwordHasher->hashPassword($user, $newPassword);
            $user->setPassword($hashedPassword);
            $user->setResetToken(null); // Supprime le jeton après réinitialisation
            $em->flush();

            $this->addFlash('success', 'Votre mot de passe a été réinitialisé avec succès.');

            return $this->redirectToRoute('app_login');
        }

        return $this->render('password_reset/reset.html.twig', ['token' => $token]);
    }
}

