import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-hero',
  standalone: true,
  templateUrl: './hero.html',
  styleUrls: ['./hero.css']
})
export class HeroComponent {
  imagePath = 'https://img.freepik.com/free-vector/fashion-illustration-with-male-model_23-2148221262.jpg?t=st=1758228522~exp=1758232122~hmac=add3ffe94ee85626bd6c0749b584c876abdddaa3306a9760f2b5ef4df30ac3e7&w=740';
}

