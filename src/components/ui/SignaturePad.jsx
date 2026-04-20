import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trash2 } from 'lucide-react';

const SignaturePadComponent = ({ onSave }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    const getCanvasContext = () => {
        return canvasRef.current.getContext('2d');
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = getCanvasContext();
        
        const resizeCanvas = () => {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            ctx.scale(ratio, ratio);
            
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Set a white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };
        
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);
    
    const getCoords = (event) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        if (event.touches && event.touches.length > 0) {
            return {
                x: event.touches[0].clientX - rect.left,
                y: event.touches[0].clientY - rect.top,
            };
        }
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    };

    const startDrawing = (event) => {
        const ctx = getCanvasContext();
        const { x, y } = getCoords(event);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
        setHasDrawn(true);
    };

    const draw = (event) => {
        if (!isDrawing) return;
        event.preventDefault();
        const ctx = getCanvasContext();
        const { x, y } = getCoords(event);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        const ctx = getCanvasContext();
        ctx.closePath();
        setIsDrawing(false);
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        const ctx = getCanvasContext();
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    };

    const handleSave = () => {
        if (!hasDrawn) {
            alert("Please provide a signature first.");
            return;
        }
        const canvas = canvasRef.current;
        const dataURL = canvas.toDataURL("image/png");
        onSave(dataURL);
    };

    return (
        <div className="w-full h-full flex flex-col" dir="ltr">
            <div className="w-full border bg-[#1a1a2e] rounded-md flex-grow touch-none">
                <canvas 
                    ref={canvasRef} 
                    className="w-full h-40"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                ></canvas>
            </div>
            <div className="flex justify-between mt-2 gap-2">
                <Button type="button" variant="outline" onClick={handleClear} size="sm">
                    <Trash2 className="w-4 h-4 mr-2" /> Clear
                </Button>
                <Button type="button" onClick={handleSave} size="sm">
                    {/* Replaced RotateCcw with a more appropriate icon for "save" */}
                    <Trash2 className="w-4 h-4 mr-2 hidden" /> Save Signature
                </Button>
            </div>
        </div>
    );
};

export default SignaturePadComponent;