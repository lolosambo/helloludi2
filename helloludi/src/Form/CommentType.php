<?php


namespace App\Form;

use App\Entity\Comment;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\HiddenType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class CommentType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('pseudo', TextType::class, [
                'label' => 'Pseudo',
            ])
            ->add('content', TextareaType::class, [
                'label' => 'Commentaire',
                'attr' => [
                    'rows' => 15,
                    'id' => 'comment_content',
                    'class' => 'froala'
                ],
            ])
            ->add('parent', HiddenType::class, [
                'mapped' => false,
                'required' => false,
            ]);
    }

    // Configuration de l'entité liée au formulaire
    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults([
            'data_class' => Comment::class,
        ]);
    }
}

