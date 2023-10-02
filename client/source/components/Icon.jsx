import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

function Icon(props) {
   const container = useRef();
   useEffect(() => {
      if (!props.src.endsWith('.svg')) return;
      fetch(`source/assets/${props.src}`)
         .then((response) => response.text())
         .then((data) => {
            if (!data.startsWith('<svg') || !container.current) return;
            container.current.innerHTML = data;
            container.current.firstChild.classList.value = props?.classNames?.icon
               ? `${container.current.firstChild.classList.value} ${props.classNames.icon}`
               : '';

            container.current.classList.value = props?.classNames?.container
               ? `${container.current.classList.value} ${props.classNames.container}`
               : '';
         })
         .catch((error) => {
            console.error('Error on load icon: ' + props.src, error);
         });
   });
   const { classNames, ...inlineProps } = props;
   return <span className="icon" ref={container} {...inlineProps} />;
}

Icon.propTypes = {
   src: PropTypes.string.isRequired,
   classNames: PropTypes.object,
};

export default Icon;
