<?php

namespace App\Form;

use App\Entity\User;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\PasswordType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class UserType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            // Champ pour le pseudo de l'utilisateur
            ->add('pseudo', TextType::class, [
                'label' => 'Pseudo'
            ])
            ->add('name', TextType::class, [
                'label' => 'Nom'
            ])
            ->add('firstName', TextType::class, [
                'label' => 'Prénom'
            ])
            // Champ pour l'email de l'utilisateur
            ->add('email', EmailType::class, [
                'label' => 'Email'
            ])
            // Champ pour le mot de passe de l'utilisateur
            ->add('password', PasswordType::class, [
                'label' => 'Password'
            ])
            ->add("theme", ChoiceType::class, [
                'choices' => [
                    "brown" => "Marron",
                    "white" => "blanc",
                    "dark" => "noir"
                ],
                'expanded' => false,
                'multiple' => false
            ]);
    }

    // Configuration de l'entité liée au formulaire
    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults([
            'data_class' => User::class,
        ]);
    }
}

