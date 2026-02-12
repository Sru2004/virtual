// eslint-disable-next-line no-unused-vars
import { useState, useEffect, Suspense, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { Canvas } from "@react-three/fiber";
// eslint-disable-next-line no-unused-vars
import { XR, ARButton, Controllers, Hands, useHitTest, useXR } from "@react-three/xr";
// eslint-disable-next-line no-unused-vars
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { api } from "../lib/api";
import { toastSuccess } from "../lib/toast";

// eslint-disable-next-line no-unused-vars
const ARArtwork = ({ imageUrl, onClose, onAddToCart }) => {
  const [texture, setTexture] = useState(null);
  const [placed, setPlaced] = useState(false);
  const [position, setPosition] = useState([0, 0, -1]);
  const [rotation, setRotation] = useState([0, 0, 0]);
  const [geometry, setGeometry] = useState([1.5, 1.5]);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (loadedTexture) => {
        setTexture(loadedTexture);
        // Calculate aspect ratio and set geometry
        const aspectRatio = loadedTexture.image.width / loadedTexture.image.height;
        const width = 1.5;
        const height = width / aspectRatio;
        setGeometry([width, height]);
      },
      undefined,
      (error) => {
        console.error('Error loading texture:', error);
        loader.load(
          'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg',
          (fallbackTexture) => {
            setTexture(fallbackTexture);
            setGeometry([1.5, 1.5]); // Default fallback
          }
        );
      }
    );
  }, [imageUrl]);

  useHitTest((hitMatrix, hit) => {
    if (hit && !placed) {
      const position = new THREE.Vector3();
      const rotation = new THREE.Quaternion();
      const scale = new THREE.Vector3();

      hitMatrix.decompose(position, rotation, scale);

      // Position the artwork slightly in front of the hit surface
      position.add(new THREE.Vector3(0, 0, 0.1));

      setPosition([position.x, position.y, position.z]);
      setRotation([rotation.x, rotation.y, rotation.z, rotation.w]);
    }
  });

  const handleTap = () => {
    if (!placed) {
      setPlaced(true);
    }
  };

  if (!texture) {
    return (
      <Html position={[0, 0, -2]} center>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p>Loading artwork...</p>
        </div>
      </Html>
    );
  }

  return (
    <>
      {/* AR Plane with artwork image */}
      {placed && (
        <mesh
          position={position}
          rotation={rotation}
          scale={[1, 1, 1]}
          onClick={handleTap}
        >
          <planeGeometry args={geometry} />
          <meshBasicMaterial map={texture} transparent />
        </mesh>
      )}

      {/* Placement Indicator */}
      {!placed && (
        <mesh position={position} onClick={handleTap}>
          <ringGeometry args={[0.1, 0.15, 32]} />
          <meshBasicMaterial color="white" />
        </mesh>
      )}

      {/* UI */}
      <Html center position={[0, 1, -2]}>
        <div className="flex flex-col gap-2">
          {placed && (
            <button
              onClick={() => setPlaced(false)}
              className="bg-blue-600 text-white px-3 py-2 rounded"
            >
              Reposition
            </button>
          )}

          <button
            onClick={onAddToCart}
            className="bg-green-600 text-white px-3 py-2 rounded"
          >
            Add to Cart
          </button>

          <button
            onClick={onClose}
            className="bg-red-600 text-white px-3 py-2 rounded"
          >
            Close AR
          </button>
        </div>
      </Html>
    </>
  );
};

const ARView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const arButtonRef = useRef();

  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [startAR, setStartAR] = useState(false);

  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        const data = await api.getArtwork(id);
        setArtwork(data);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchArtwork();
  }, [id]);

  useEffect(() => {
    if (startAR && arButtonRef.current) {
      // Auto-click the ARButton to start the session
      const timer = setTimeout(() => {
        arButtonRef.current?.click();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [startAR]);

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cartItems") || "{}");
    cart[artwork._id] = (cart[artwork._id] || 0) + 1;
    localStorage.setItem("cartItems", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
    toastSuccess(`Added "${artwork.title}" to cart!`);
    navigate("/cart");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading AR...</p>
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Failed to load artwork</p>
      </div>
    );
  }

  if (startAR) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <ARButton
          ref={arButtonRef}
          sessionInit={{
            mode: 'immersive-ar',
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay'],
          }}
          className="absolute top-4 left-4 z-10 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Start AR
        </ARButton>

        <Canvas>
          <XR
            sessionInit={{
              mode: 'immersive-ar',
              requiredFeatures: ['hit-test'],
              optionalFeatures: ['dom-overlay'],
            }}
          >
            <Controllers />
            <Hands />

            <Suspense fallback={null}>
              <ARArtwork
                imageUrl={artwork.image_url}
                onClose={() => setStartAR(false)}
                onAddToCart={handleAddToCart}
              />
            </Suspense>
          </XR>
        </Canvas>

        {/* Instructions overlay */}
        <div className="absolute top-4 left-4 right-4 z-10 bg-black bg-opacity-50 text-white p-4 rounded-lg">
          <p className="text-sm mb-2">Point your camera at a wall or flat surface</p>
          <p className="text-xs opacity-75">Tap the screen to place the artwork</p>
        </div>

        {/* Close button */}
        <button
          onClick={() => setStartAR(false)}
          className="absolute top-4 right-4 z-10 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Close AR
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <img
        src={artwork.image_url}
        alt={artwork.title}
        className="max-w-md rounded shadow-lg mb-6"
      />

      <div className="flex gap-4">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-600 text-white px-6 py-3 rounded"
        >
          Back
        </button>

        <button
          onClick={() => setStartAR(true)}
          className="bg-purple-600 text-white px-6 py-3 rounded"
        >
          View in AR
        </button>

        <button
          onClick={handleAddToCart}
          className="bg-green-600 text-white px-6 py-3 rounded"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ARView;
