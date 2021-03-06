import { useRouter } from 'next/dist/client/router';
import { useState } from 'react';
import { supabase } from '../../../supabase-client';
import BikeForm from '../../../components/bike-form';

export default function EditBike({ bike }) {
  const [bikeMake, setBikeMake] = useState(bike.make)
  const [bikeModel, setBikeModel] = useState(bike.model)
  const [bikeYear, setBikeYear] = useState(bike.production_year)
  const [bikeImagePath, setBikeImagePath] = useState(bike.file_path)
  const router = useRouter();

  return (
    <>
      <h1>Edit bike</h1>
      <BikeForm
        bikeMake={bikeMake}
        onMakeChange={(evt) => setBikeMake(evt.target.value)}
        bikeModel={bikeModel}
        onModelChange={(evt) => setBikeModel(evt.target.value)}
        bikeYear={bikeYear}
        onYearChange={(evt) => setBikeYear(evt.target.value)}
        onBikeImageChange={(evt) => {
          const imageFile = evt.target.files[0]
          const imagePath = `public/${imageFile.name}`
          supabase.storage
            .from('bike_images')
            .upload(
              imagePath,
              imageFile,
              { upsert: true })
            .then(response => {
              setBikeImagePath(imagePath)
            })
            .catch(error => {
              // TODO: show error message popup
            })
        }}
        onSubmit={async (evt) => {
          evt.preventDefault();
          await supabase
            .from('bikes')
            .update({
              make: bikeMake,
              model: bikeModel,
              production_year: bikeYear,
              file_path: bikeImagePath,
            })
            .match({
              id: bike.id,
            });

          router.push('/')
        }}
      />
    </>
  )
}

export const getServerSideProps = async (context) => {
  // get the user using the "sb:token" cookie
  const { user } = await supabase.auth.api.getUserByCookie(context.req)
  if (!user) {
    return {
      redirect: {
        destination: '/signin',
        permanent: false,
      }
    }
  }

  supabase.auth.setAuth(context.req.cookies["sb:token"])
  const { data: bike, error } = await supabase
    .from('bikes')
    .select('*')
    .eq('id', context.query.id)
    .single()

  if (error) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      bike
    }
  }
}
