<?php

namespace App\Controller;

use App\Entity\Comment;
use App\Entity\Post;
use App\Entity\Rating;
use App\Entity\User;
use App\Form\CommentType;
use App\Form\RatingType;
use App\Repository\PostRepository;
use App\Form\PostType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Form\FormFactoryInterface;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;

class PostController extends AbstractController
{
    #[Route('/', name: 'homepage')]
    public function indexAction(Request $request, PostRepository $postRepository)
    {
        $posts = $postRepository->find4LastPosts();
        $eventsPosts = $postRepository->findByCategory("event");
        return $this->render('home.html.twig', [
            'posts' => $posts,
            "eventsPosts" => $eventsPosts,
        ]);
    }

    #[Route('/posts/unpublished', name: 'posts_unpublished')]
    public function unpublishedAction(Request $request, PostRepository $postRepository)
    {
        $posts = $postRepository->findUnpublishedPosts();
        $eventsPosts = $postRepository->findByCategory("event");
        return $this->render('home.html.twig', [
            'posts' => $posts,
            "eventsPosts" => $eventsPosts,
        ]);
    }

    #[Route('/recipes', name: 'recipes')]
    public function recipesAction(PostRepository $postRepository)
    {
        $posts = $postRepository->findByCategory("recipe");
        $eventsPosts = $postRepository->findByCategory("event");
        return $this->render('home.html.twig', [
            'posts' => $posts,
            "eventsPosts" => $eventsPosts
        ]);
    }

    #[Route('/events', name: 'events')]
    public function eventsAction(PostRepository $postRepository)
    {
        $posts = $postRepository->findByCategory("event");
        $eventsPosts = $postRepository->findByCategory("event");
        return $this->render('home.html.twig', [
            'posts' => $posts,
            "eventsPosts" => $eventsPosts
        ]);
    }

    #[Route('/photos', name: 'photos')]
    public function photosAction(PostRepository $postRepository)
    {
        $posts = $postRepository->findByCategory("photo");
        $eventsPosts = $postRepository->findByCategory("event");
        return $this->render('home.html.twig', [
            'posts' => $posts,
            "eventsPosts" => $eventsPosts
        ]);
    }

    #[Route('/blabla', name: 'blabla')]
    public function blablaAction(PostRepository $postRepository)
    {
        $posts = $postRepository->findByCategory("blabla");
        $eventsPosts = $postRepository->findByCategory("event");
        return $this->render('home.html.twig', [
            'posts' => $posts,
            "eventsPosts" => $eventsPosts
        ]);
    }

    #[Route('/post/create', name: 'post_create')]
    public function create(Request $request, EntityManagerInterface $em)
    {
        $post = new Post();
        $form = $this->createForm(PostType::class, $post);

        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            if ($form->get('category')->getData() === "event") {
                $post->setDate($form->get('date')->getData());
                $post->setPlace($form->get('place')->getData());
            } elseif ($form->get('category')->getData() === "recipe") {
                $post->setPersonsNumber($form->get('personsNumber')->getData());
                $post->setCookingTime($form->get('cookingTime')->getData());
            } else {
                $post->setDate(null);
                $post->setPlace(null);
                $post->setPersonsNumber(null);
                $post->setCookingTime(null);
            }
            $post->setUser($this->getUser());
            $post->setCreationDate(new \DateTime());
            $post->setCategory($form->get('category')->getData());

            /** @var UploadedFile $file */
            $file = $form->get('image')->getData();

            if ($file) {
                $originalFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $newFilename = $originalFilename.'-'.uniqid().'.'.$file->guessExtension();

                $destination = $this->getParameter('images_directory');
                $file->move($destination, $newFilename);

                $post->setImage("img/posts/" . $newFilename);
            }

            $em->persist($post);
            $em->flush();

            $this->addFlash('success', 'Article créé avec succès');
            return $this->redirectToRoute('post_detail', ["post" => $post->getId()]);
        }
        $eventsPosts = $em->getRepository(Post::class)->findByCategory("event");
        return $this->render('post/create.html.twig', [
            'form' => $form->createView(),
            'eventsPosts' => $eventsPosts

        ]);
    }

    #[Route('/post/{post}', name: 'post_detail')]
    public function detail(
        Request $request,
        Post $post,
        Security $security,
        EntityManagerInterface $em,
        FormFactoryInterface $formFactory
    ){
        $comment = new Comment();
        $form = $formFactory->create(CommentType::class, $comment, [
            'action' => $this->generateUrl('post_add_comment', ['post' => $post->getId()]),
            'method' => 'POST',
        ]);

        $replyForms = [];

        $comments = $post->getComments();
        foreach ($comments as $singleComment) {
            $reply = new Comment();
            $reply->setParent($singleComment);
            $replyForms[$singleComment->getId()] = $this->createForm(CommentType::class, $reply, [
                'action' => $this->generateUrl('post_add_reply', ['comment' => $singleComment->getId()]),
                'method' => 'POST',
            ]);
        }

        $comments = $em->getRepository(Comment::class)->findBy(
            [
                'post' => $post,
                'parent' => null
            ],
            ['creationDate' => 'DESC']
        );

        $user = $security->getUser();
        $userRated = false;
        $userRating = null;

        if ($user) {
            $rating = $em->getRepository(Rating::class)
                ->findOneBy(['user' => $user, 'post' => $post]);

            if ($rating) {
                $userRated = true;
                $userRating = $rating->getRating();
            }
        }

        $ratingForm = $this->createForm(RatingType::class);
        $ratingForm->handleRequest($request);
        if ($ratingForm->isSubmitted() && $ratingForm->isValid()) {
            $rating = $ratingForm->get('rating')->getData();
            $post->addRating($rating);
            $em->flush();

            $this->addFlash('success', 'Merci pour votre vote !');
        }

        $eventsPosts = $em->getRepository(Post::class)->findByCategory("event");
        return $this->render('post/detail.html.twig', [
            'post' => $post,
            'eventsPosts' => $eventsPosts,
            'form' =>$form,
            'replyForms' => array_map(fn($form) => $form->createView(), $replyForms),
            'comments' => $comments,
            'ratingForm' => $ratingForm->createView(),
            'userRated' => $userRated,
            'userRating' => $userRating,
        ]);
    }


    #[Route('/post/{post}/edit', name: 'post_edit')]
    public function edit(Request $request, Post $post, EntityManagerInterface $em)
    {
        $form = $this->createForm(PostType::class, $post);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $post->setUpdateDate(new \DateTime());
            /** @var UploadedFile $file */
            $file = $form->get('image')->getData();

            if ($file) {
                $originalFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $newFilename = $originalFilename.'-'.uniqid().'.'.$file->guessExtension();

                $destination = $this->getParameter('images_directory');
                $file->move($destination, $newFilename);

                $post->setImage("img/posts/" . $newFilename);
            }
            $em->flush();
            $this->addFlash('success', 'Article modifié avec succès');
            return $this->redirectToRoute('post_edit', ['post' => $post->getid()]);
        }

        $eventsPosts = $em->getRepository(Post::class)->findByCategory("event");
        return $this->render('post/edit.html.twig', [
            'form' => $form->createView(),
            'post' => $post,
            'eventsPosts' => $eventsPosts
        ]);
    }


    #[Route('/post/{post}/delete', name: 'post_delete')]
    public function delete(Post $post, EntityManagerInterface $em)
    {
        $em->remove($post);
        $em->flush();

        $this->addFlash('success', 'Article supprimé avec succès.');
        return $this->redirectToRoute('homepage');
    }

    #[Route('/post/{post}/publish', name: 'post_publish')]
    public function publish(Post $post, EntityManagerInterface $em)
    {
        $post->setOnLine(true);
        $em->flush();

        $this->addFlash('success', 'Article publié avec succès.');
        return $this->redirectToRoute('homepage');
    }


    #[Route('/upload_image', name: 'upload_image', methods: ["POST"])]
    public function uploadImage(Request $request)
    {
        $file = $request->files->get('file');

        if ($file instanceof UploadedFile) {
            $filename = uniqid() . '.' . $file->guessExtension();
            $directory = $this->getParameter('kernel.project_dir') . '/public/img/froala/';

            try {
                $file->move($directory, $filename);
                return new JsonResponse(['link' => '/img/froala/' . $filename]);
            } catch (FileException $e) {
                return new JsonResponse(['error' => 'Erreur lors de l\'upload de l\'image.']);
            }
        }

        return new JsonResponse(['error' => 'Aucun fichier envoyé.']);
    }

    #[Route('/post/{post}/user/{user}/like', name: 'post_like')]
    public function like(Request $request, Post $post, User $user, EntityManagerInterface $em)
    {
        $likes = $post->getLikes();
        $likes[] = $user->getid();
        $post->setLikes($likes);
        $em->flush();

        return $this->redirectToRoute('post_detail', ['post' => $post->getId()]);
    }

    #[Route('/post/{post}/add-comment', name: 'post_add_comment', methods: ['POST'])]
    public function addComment(Request $request, Post $post, EntityManagerInterface $em)
    {
        // Nouveau commentaire
        $comment = new Comment();
        $form = $this->createForm(CommentType::class, $comment);
        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            // Vérification de l'existence d'un parent (optionnel pour les réponses)
            $parentId = $request->request->all('comment')['parent'] ?? null;
            if ($parentId) {
                $parent = $em->getRepository(Comment::class)->find($parentId);
                if ($parent) {
                    $comment->setParent($parent);
                } else {
                    $this->addFlash('error', 'Le commentaire parent est introuvable.');
                    return $this->redirectToRoute('post_detail', ['post' => $post->getId()]);
                }
            }

            // Attribution des propriétés
            $comment->setPost($post);
            $comment->setCreationDate(new \DateTime());
            $comment->setPseudo($form->get('pseudo')->getData());
            $comment->setContent($form->get('content')->getData());

            // Persistance en base
            $em->persist($comment);
            $em->flush();

            $this->addFlash('success', 'Commentaire ajouté avec succès.');
        } else {
            $this->addFlash('error', 'Erreur lors de l’ajout du commentaire.');
        }

        return $this->redirectToRoute('post_detail', [
            'post' => $post->getId(),
        ]);
    }

    #[Route('/comment/{comment}/reply', name: 'post_add_reply')]
    public function addReply(Request $request, Comment $comment, EntityManagerInterface $em)
    {
        $parentId = $comment->getid();
        $post = $comment->getPost();
        if (!$parentId) {
            $this->addFlash('error', 'Aucun commentaire parent spécifié.');
            return $this->redirectToRoute('post_detail', ['post' => $post->getId()]);
        }

        $parent = $em->getRepository(Comment::class)->find($parentId);
        if (!$parent) {
            $this->addFlash('error', 'Le commentaire parent est introuvable.');
            return $this->redirectToRoute('post_detail', ['post' => $post->getId()]);
        }

        // Création d'un nouveau commentaire de type réponse
        $reply = new Comment();
        $form = $this->createForm(CommentType::class, $reply);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $reply->setPost($post);
            $reply->setPseudo($form->get('pseudo')->getData());
            $reply->setCreationDate(new \DateTime());
            $reply->setParent($parent);
            $reply->setContent($form->get('content')->getData());

            $em->persist($reply);
            $em->flush();

            $this->addFlash('success', 'Réponse ajoutée avec succès.');
            return $this->redirectToRoute('post_detail', ['post' => $post->getId()]);
        }

        // En cas d'erreur
        $this->addFlash('error', 'Erreur lors de l\'ajout de la réponse.');
        return $this->redirectToRoute('post_detail', ['post' => $post->getId()]);
    }

    #[Route('/post/{post}/rate', name: 'post_rate', methods: ['POST'])]
    public function rateAjax(
        Post $post,
        Request $request,
        EntityManagerInterface $entityManager,
        CsrfTokenManagerInterface $csrfTokenManager
    ): JsonResponse {

        $csrfToken = $request->headers->get('X-CSRF-TOKEN');
        if (!$csrfTokenManager->isTokenValid(new CsrfToken('rate', $csrfToken))) {
            return new JsonResponse(['error' => 'Invalid CSRF token'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $cookie = $request->cookies->get('voted_posts');
        $votedPosts = $cookie ? json_decode($cookie, true) : [];
        if (!is_array($votedPosts)) {
            $votedPosts = [];
        }

        if (in_array($post->getId(), $votedPosts)) {
            return new JsonResponse(['success' => false, 'message' => 'Vous avez déjà voté pour cette recette.'], 400);
        }

        if (isset($data['rating']) && is_numeric($data['rating'])) {
            $rating = new Rating();
            $rating->setRating((float) $data['rating']);
            $rating->setPost($post);
            $rating->setUser($this->getUser());
            $entityManager->persist($rating);

            if ($rating->getRating() >= 1 && $rating->getRating() <= 5) {
                $post->addRating($rating);
                $post->setRatingCount($post->getRatingCount() + 1);
                $ratings = $post->getRatings();
                $totalResult = 0;
                foreach ($ratings as $vote){
                    $totalResult += $vote->getRating();
                }
                $post->setAverageRating($totalResult / count($ratings));
                $entityManager->flush();

                // Ajoute le post dans les cookies
                $votedPosts[] = $post->getId();

                $response = new JsonResponse(['status' => "success", 'message' => 'Note enregistrée avec succès !']);
                $response->headers->setCookie(new Cookie('voted_posts', json_encode($votedPosts), strtotime('+1 year')));
                return $response;
            }
        }

        return new JsonResponse(['status' => "failed", 'message' => 'Données invalides.'], 400);
    }
}

