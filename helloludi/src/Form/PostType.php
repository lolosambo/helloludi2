<?php

namespace App\Form;

use App\Entity\Post;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\DateTimeType;
use Symfony\Component\Form\Extension\Core\Type\DateType;
use Symfony\Component\Form\Extension\Core\Type\FileType;
use Symfony\Component\Form\Extension\Core\Type\NumberType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints\File;
use Symfony\Component\Validator\Constraints\NotBlank;

class PostType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            // Champ pour le titre du Post
            ->add('title', TextType::class, [
                'label' => 'Titre',
            ])
            // Pour le contenu, on utilise TextareaType mais on le remplacera par l'éditeur riche en Twig
            ->add('content', TextareaType::class, [
                'label' => 'Contenu',
                'required' => false,
                'attr' => [
                    'rows' => 10,
                ],
            ])

            // Champ pour l'image du Post (optionnel)
            ->add('image', FileType::class, [
                'label' => 'Image à la une (optionnel)',
                'required' => false,
                'mapped' => false,
                'constraints' => [
                    new File([
                        'maxSize' => '20M',
                        'mimeTypes' => ['image/jpeg', 'image/png'],
                        'mimeTypesMessage' => 'Veuillez télécharger une image JPG ou PNG valide.',
                    ])
                ],
            ])
            ->add("category", ChoiceType::class, [
                'choices' => [
                    "Recette" => "recipe",
                    "Photo" => "photo",
                    "Evènement" => "event",
                    "Blabla" => "blabla"
                ],
                'expanded' => false,
                'multiple' => false
            ])
            ->add("date", DateTimeType::class, [
                'label' => 'Date de la manifestation',
                'widget' => 'single_text',
                'html5' => true,
                'attr' => ['class' => 'hidden'],
                'required' => false
            ])
            ->add("place", TextType::class, [
                'label' => 'Lieu de la manifestation',
                'attr' => ['class' => 'hidden'],
                'required' => false
            ])
            ->add("personsNumber", NumberType::class, [
                'label' => 'Nombre de personne',
                'required' => false
            ])
            ->add("cookingTime", NumberType::class, [
                'label' => 'Temps de préparation',
                'required' => false
            ]);
    }

    // Configuration de l'entité liée au formulaire
    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults([
            'data_class' => Post::class,
        ]);
    }
}
