<?php

namespace App\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class ContactType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('name', TextType::class, [
                'label' => 'Votre nom',
                'attr' => ['placeholder' => 'Entrez votre nom'],
                'required' => true
            ])
            ->add('firstName', TextType::class, [
                'label' => 'Votre prénom',
                'attr' => ['placeholder' => 'Entrez votre prénom'],
                'required' => true
            ])
            ->add('city', TextType::class, [
                'label' => 'Votre ville',
                'attr' => ['placeholder' => 'Entrez votre ville'],
                'required' => false
            ])
            ->add('email', EmailType::class, [
                'label' => 'Votre email',
                'attr' => ['placeholder' => 'Entrez votre email'],
                'required' => true
            ])
            ->add('message', TextareaType::class, [
                'label' => 'Votre message',
                'attr' => ['placeholder' => 'Entrez votre message'],
                'required' => true
            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([]);
    }
}
