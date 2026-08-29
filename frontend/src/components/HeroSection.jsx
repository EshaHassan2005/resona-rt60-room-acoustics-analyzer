import React from 'react';
import heroBg from '../assets/orchestra.png';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HeroSection({ onOpenAbout, onOpenAnalyzer }) {
  return (
    <section
      className="hero-section"
      style={{ backgroundImage: `url(${heroBg})` }}
      id="hero"
    >
      <div className="hero-overlay"></div>

      <div className="container hero-content">
        

        <h1 className="hero-title" style={{margin:'0px',fontSize:'67px',fontWeight:'500',color:'#FFFAFD',textShadow:'none',marginLeft:'-822px',marginBottom:'-23px'}}>RESONA</h1>
        <div style={{backgroundColor:'#FFFAFD',width:'750px',height:'2px',zIndex:'10',opacity:'.5',marginLeft:'-372px',marginBottom:'19px'}}></div>

        <p className="hero-description" style={{textAlign:'left',marginLeft:'-370px',marginBottom:'45px'}}>
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
          doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore
          veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim
          ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
          consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
        </p>

        <div className="hero-actions">
          <button 
            className="btn-pill-primary"
            style={{marginTop:'23px',backgroundColor:'#2B3D2F',color:'#ffffff',opacity:'.8',fontSize:'18px',fontWeight:'500'}}
            onClick={onOpenAbout}
          >
            LEARN MORE ABOUT US
          </button>
        </div>
      </div>
    </section>
  );
}
