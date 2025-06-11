<?php

namespace App\Controller;

use App\Entity\Comment;
use App\Entity\Post;
use App\Entity\Rating;
use App\Entity\User;
use App\Form\CommentType;
use App\Form\RatingType;
use App\Form\WhoAmIType;
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

class WhoAmIController extends AbstractController
{
    #[Route('/whoAmI', name: 'who_am_i')]
    public function whoAmI(Request $request, EntityManagerInterface $em)
    {
        $whoAmIPost = $em->getRepository(Post::class)->findOneBy(["title" => "Qui suis-je ?"]);

        return $this->render('post/who_am_i.html.twig', [
            "whoAmIPost" => $whoAmIPost
        ]);
    }

    #[Route('/whoAmI/edit', name: 'who_am_i_edit')]
    public function whoAmIEdit(Request $request, EntityManagerInterface $em)
    {
        $post = $em->getRepository(Post::class)->findOneByTitle('Qui suis-je ?');
        if(!$post){
            $post = new Post();
            $post->setTitle("Qui suis-je ?");
            $post->setCategory("whoAmI");
            $post->setCreationDate(new \DateTime());
        }

        $form = $this->createForm(WhoAmIType::class, $post);

        if($post->getId()){
            $form->get('content')->setData($post->getContent());
        }
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $post->setContent($form->get('content')->getData());
            $post->setUser($em->getRepository(User::class)->find($this->getUser()->getId()));
            $post->setUpdateDate(new \DateTime());
            if(!$em->getRepository(Post::class)->findOneByTitle('Qui suis-je ?'))
                $em->persist($post);
            $em->flush();

            $this->addFlash('success', 'Article "Qui suis-je ?" modifié avec succès');
            return $this->redirectToRoute('who_am_i');
        }
        return $this->render('post/who_am_i_edit.html.twig', [
            'form' => $form->createView(),
        ]);
    }
}

