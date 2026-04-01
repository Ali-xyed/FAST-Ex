import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function EditListingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    toast.error('Edit listing feature is not available. Please delete and create a new listing.');
    navigate(-1);
  }, [navigate]);

  return null;
}

export default EditListingPage;
