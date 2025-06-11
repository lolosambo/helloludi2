<?php

namespace App\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\FormBuilderInterface;

class RatingType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->add('rating', ChoiceType::class, [
            'choices' => [
                '1 étoile' => 1,
                '2 étoiles' => 2,
                '3 étoiles' => 3,
                '4 étoiles' => 4,
                '5 étoiles' => 5,
            ],
            'expanded' => true,
            'multiple' => false,
        ]);
    }
}
