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
          Here at <span className="bolded" style={{fontWeight:'700'}}>Resona</span>, we accede to your acoustic demands via 
          providing routes to dissecting, analyzing and tuning the auditory characteristics of your space. We have always 
          coveted for the highest degree of customer satisfaction through utilizing the most recent and innovative methods available 
          in the realm of sound technology. A space's acoustic character is what brings it to life and makes the 
          audience feel engulfed in whatever melody the space decides to convey. Start your journey with us via learning 
          more about what we do.
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
