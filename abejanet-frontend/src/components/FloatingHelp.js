import React, { useState, useRef, useEffect, useContext } from 'react';
import { FaQuestionCircle, FaTimes, FaPaperPlane, FaComments } from 'react-icons/fa';
import './FloatingHelp.css';
import { ThemeContext } from '../ThemeContext';

const FAQ = [
  { id: 1, question: '¿Cómo agregar un usuario?', keywords: ['agregar usuario','crear usuario','añadir usuario','nuevo usuario'] },
  { id: 2, question: '¿Cómo editar o eliminar un usuario?', keywords: ['editar usuario','eliminar usuario','borrar usuario','modificar usuario'] },
  { id: 3, question: '¿Cómo agregar un apiario?', keywords: ['agregar apiario','crear apiario','nuevo apiario','añadir apiario'] },
  { id: 4, question: '¿Cómo editar o eliminar un apiario?', keywords: ['editar apiario','eliminar apiario','borrar apiario','modificar apiario'] },
  { id: 5, question: '¿Relación entre apiario y colmena?', keywords: ['relacion apiario colmena','apiario tiene colmenas','vinculo','pertenece'] },
  { id: 6, question: '¿Cómo agregar una colmena a un apiario?', keywords: ['agregar colmena','crear colmena','añadir colmena','nueva colmena'] },
  { id: 7, question: '¿Cómo ver colmenas de un apiario?', keywords: ['ver colmenas apiario','listar colmenas','colmenas por apiario'] },
  { id: 8, question: '¿Cómo editar, eliminar o ver detalle de una colmena?', keywords: ['editar colmena','eliminar colmena','detalle colmena','borrar colmena','ver colmena'] },
  { id: 9, question: '¿Dónde veo sensores?', keywords: ['sensores','ver sensores','mediciones'] },
  { id: 10, question: '¿Dónde veo reportes?', keywords: ['reportes','informes','graficas','estadisticas'] },
  { id: 11, question: '¿No puedo iniciar sesión?', keywords: ['login','iniciar sesion','contrasena','contraseña','acceso'] },
  { id: 12, question: '¿Cómo cerrar sesión?', keywords: ['cerrar sesion','logout','salir'] }
];

const getAnswer = (text) => {
  const lower = text.toLowerCase();
  if (lower.includes('agregar usuario') || lower.includes('crear usuario') || lower.includes('añadir usuario') || lower.includes('nuevo usuario')) return 'Para agregar un usuario: ve a **Usuarios** (menú lateral) → pulsa **Agregar usuario** → completa nombre, correo, contraseña y rol → guarda.';
  if (lower.includes('editar usuario') || lower.includes('modificar usuario')) return 'Para editar un usuario: ve a **Usuarios** → busca el usuario → pulsa el ícono de editar → modifica los campos → guardar.';
  if (lower.includes('eliminar usuario') || lower.includes('borrar usuario')) return 'Para eliminar un usuario: ve a **Usuarios** → pulsa el ícono de eliminar sobre el registro → confirma la acción.';
  if (lower.includes('agregar apiario') || lower.includes('crear apiario') || lower.includes('nuevo apiario') || lower.includes('añadir apiario')) return 'Para agregar un apiario: ve a **Apiarios** → **Nuevo apiario** → ingresa nombre, ubicación y descripción → guardar.';
  if (lower.includes('editar apiario') || lower.includes('modificar apiario')) return 'Para editar un apiario: ve a **Apiarios** → ícono editar en el apiario deseado → actualiza los datos → guardar.';
  if (lower.includes('eliminar apiario') || lower.includes('borrar apiario')) return 'Para eliminar un apiario: ve a **Apiarios** → ícono eliminar → confirma.';
  if (lower.includes('relacion') && lower.includes('apiario') && lower.includes('colmena')) return '**Relación Apiario–Colmena:** Un **Apiario** puede tener **varias Colmenas**. Cada **Colmena** pertenece a un **Apiario** específico. Es decir, relación **1:N** (uno a muchos).';
  if (lower.includes('agregar colmena') || lower.includes('crear colmena') || lower.includes('añadir colmena') || lower.includes('nueva colmena')) return 'Para agregar una colmena a un apiario: ve a **Apiarios** → abre las **Colmenas** de ese apiario (o desde **Colmenas** filtrando por apiario) → **Crear colmena** → completa los datos → guardar. La colmena quedará vinculada a ese apiario.';
  if (lower.includes('ver colmenas apiario') || lower.includes('colmenas por apiario')) return 'Para ver colmenas de un apiario: ve a **Apiarios** → selecciona el apiario → ver listado de colmenas, o ve a **Colmenas** y filtra por el apiario correspondiente.';
  if (lower.includes('editar colmena') || lower.includes('modificar colmena')) return 'Para editar una colmena: ve a **Colmenas** (del apiario) → ícono editar → modifica campos → guardar.';
  if (lower.includes('eliminar colmena') || lower.includes('borrar colmena')) return 'Para eliminar una colmena: ve a **Colmenas** → ícono eliminar → confirma.';
  if (lower.includes('detalle colmena') || lower.includes('ver detalle')) return 'Para ver detalle de una colmena: ve a **Colmenas** → ícono/ver detalle → se muestra info de la colmena, historial y **sensores** asociados.';
  if (lower.includes('sensor')) return 'Los **Sensores** muestran información asociada a las colmenas. Puedes consultarlos desde **Sensores** o desde el **detalle de colmena**.';
  if (lower.includes('reporte') || lower.includes('informe') || lower.includes('grafica') || lower.includes('estadistica')) return 'Ve a **Reportes** para visualizar reportes y gráficas del sistema.';
  if (lower.includes('login') || lower.includes('iniciar sesion') || lower.includes('contraseña') || lower.includes('contrasena') || lower.includes('acceso')) return 'Si no puedes iniciar sesión: verifica correo y contraseña. Si el problema persiste, contacta al administrador.';
  if (lower.includes('cerrar sesion') || lower.includes('logout') || lower.includes('salir')) return 'Para cerrar sesión: pulsa **Cerrar sesión** en el menú lateral.';
  return 'No encuentro una respuesta exacta. Prueba con una de las preguntas rápidas o escribe tu duda con palabras como: \"agregar apiario\", \"crear colmena\", \"relación apiario colmena\".';
};

function FloatingHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: Date.now(), sender: 'bot', text: '¡Hola! Soy el asistente de ayuda. ¿En qué puedo ayudarte?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (textParam) => {
    const text = (textParam || input).trim();
    if (!text) return;
    const userMsg = { id: Date.now(), sender: 'user', text };
    const botMsg = { id: Date.now() + 1, sender: 'bot', text: getAnswer(text) };
    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const askQuick = (q) => handleSend(q);

  return (
    <div className={'floating-help ' + (theme === 'dark' ? 'dark' : 'light')}>
      {isOpen && (
        <div className='help-panel'>
          <div className='help-header'>
            <div className='help-title'>
              <FaComments /> Ayuda / Chatbot
            </div>
            <button className='help-close' onClick={() => setIsOpen(false)}>
              <FaTimes />
            </button>
          </div>
          <div className='help-body'>
            <div className='messages'>
              {messages.map(msg => (
                <div key={msg.id} className={'msg ' + msg.sender}>
                  <div className='msg-bubble'>{msg.text}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className='quick-questions'>
              {FAQ.slice(0, 6).map(f => (
                <button key={f.id} className='quick-btn' onClick={() => askQuick(f.question)}>
                  {f.question}
                </button>
              ))}
            </div>
          </div>
          <div className='help-input'>
            <input
              type='text'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder='Escribe tu duda...'
              autoFocus
            />
            <button className='send-btn' onClick={() => handleSend()}>
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
      <button className='help-toggle' onClick={() => setIsOpen(!isOpen)} title='Ayuda'>
        {isOpen ? <FaTimes /> : <FaQuestionCircle />}
      </button>
    </div>
  );
}

export default FloatingHelp;
