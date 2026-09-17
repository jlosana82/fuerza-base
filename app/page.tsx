import FitnessApp from '@/components/fitness/app';
import {getChatGPTUser} from './chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();return <FitnessApp demo={!user}/>;}
