<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Cookie;

class CookieController extends AbstractController
{
    #[Route('/cookies', name: 'cookie_banner', methods: ['GET', 'POST'])]
    public function manageCookies(Request $request): Response
    {
        $response = $this->redirectToRoute('homepage');
        if ($request->isMethod('POST')) {
            $acceptCookies = $request->request->get('accept_cookies', 'no');


            $cookie = new Cookie(
                'accept_cookies',
                $acceptCookies === 'yes' ? 'true' : 'false',
                strtotime('+1 year'),
                '/',
                null,
                false,
                true
            );

            $response->headers->setCookie($cookie);

            return $response;
        }

        return $response;
    }
}
