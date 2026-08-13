import { Component, ViewEncapsulation, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'custom-libchat',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [],
  templateUrl: './libchat.component.html',
  styleUrl: './libchat.component.scss'
})
export class LibchatComponent implements OnInit {

  constructor(private renderer: Renderer2) {}

  ngOnInit() {
    const urlToLoad = 'https://latrobe.libanswers.com/load_chat.php?hash=a95034aaa8233650802f6802fd9a77c5167a3f9120227c7e429654db7b3ecd0b';
    const existing = document.querySelector(`script[src="${urlToLoad}"]`);

    if (!existing) {
      const script = this.renderer.createElement('script');
      script.src = urlToLoad;
      script.async = true;

      this.renderer.appendChild(document.body, script);
    }

  }
}
