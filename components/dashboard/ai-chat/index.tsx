'use client';

/*eslint-disable*/
import MessageBoxChat from '@/components/MessageBoxChat';
import DashboardLayout from '@/components/layout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Bgdark from '@/public/img/dark/ai-chat/bg-image.png';
import Bg from '@/public/img/light/ai-chat/bg-image.png';
import { ChatBody, OpenAIModel } from '@/types/types';
import { Database } from '@/types/types_db';
import { Session, User } from '@supabase/supabase-js';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useState } from 'react';
import { HiUser, HiSparkles, HiMiniPencilSquare } from 'react-icons/hi2';

type Subscription = Database['public']['Tables']['subscriptions']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type Price = Database['public']['Tables']['prices']['Row'];
interface ProductWithPrices extends Product {
  prices: Price[];
}
interface PriceWithProduct extends Price {
  products: Product | null;
}
interface SubscriptionWithProduct extends Subscription {
  prices: PriceWithProduct | null;
}

interface Props {
  session: Session | null;
  user: User | null | undefined;
  products: ProductWithPrices[];
  subscription: SubscriptionWithProduct | null;
  userDetails: { [x: string]: any } | null;
  apiKeyApp: any;
}
export default function Chat(props: Props) {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  // *** If you use `.env.local` variable for your API key, method which we recommend, use the apiKey variable commented below
  // Input States
  const [inputOnSubmit, setInputOnSubmit] = useState<string>('');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [inputApiKey, setInputApiKey] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  // Response message
  const [outputCode, setOutputCode] = useState<string>('');
  // ChatGPT model
  const [model, setModel] = useState<OpenAIModel>('gpt-4-1106-preview');
  // Loading state
  const [loading, setLoading] = useState<boolean>(false);

  // API Key
  const handleTranslate = async () => {
    setInputOnSubmit(inputMessage);

    // Chat post conditions(maximum number of characters, valid message etc.)
    const maxCodeLength = model === 'gpt-4-1106-preview' ? 700 : 700;

    if (!inputMessage) {
      alert('Please enter your subject.');
      return;
    }

    if (inputMessage.length > maxCodeLength) {
      alert(
        `Please enter code less than ${maxCodeLength} characters. You are currently at ${inputMessage.length} characters.`,
      );
      return;
    }
    setOutputCode(' ');
    setLoading(true);
    const controller = new AbortController();
    const body: ChatBody = {
      inputMessage,
      model,
      apiKey,
    };

    // -------------- Fetch --------------
    const response = await fetch('/api/chatAPI', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      setLoading(false);
      if (response) {
        alert(
          'Something went wrong went fetching from the API. Make sure to use a valid API key.',
        );
      }
      return;
    }

    const data = response.body;

    if (!data) {
      setLoading(false);
      alert('Something went wrong');
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      setLoading(true);
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      setOutputCode((prevCode) => prevCode + chunkValue);
    }

    setLoading(false);
  };
  // -------------- Copy Response --------------
  // const copyToClipboard = (text: string) => {
  //  const el = document.createElement('textarea');
  //  el.value = text;
  //  document.body.appendChild(el);
  //  el.select();
  //  document.execCommand('copy');
  //  document.body.removeChild(el);
  // };

  const handleChange = (Event: any) => {
    setInputMessage(Event.target.value);
  };
  const handleInputApiKey = (Event: any) => {
    setInputApiKey(Event.target.value);
  };
  const handleApiKey = (Event: any) => {
    setApiKey(inputApiKey);
    toast({
      title: 'API Key was set!',
      description: 'Succesfully set API key!',
    });
  };

  return (
    <DashboardLayout
      session={props.session}
      userDetails={props.userDetails}
      user={props.session?.user}
      products={props.products}
      subscription={props.subscription}
      title="AI Generator"
      description="AI Generator"
    >
      <div className="relative flex w-full flex-col pt-[20px] md:pt-0">
        <div className="absolute left-[20%] top-[50%] z-[0] w-[200px] translate-y-[-50%] md:left-[35%] lg:left-[38%] xl:left-[38%] xl:w-[350px] ">
          <Image
            width="340"
            height="181"
            src={theme === 'dark' ? Bgdark.src : Bg.src}
            className="absolute z-[0] w-[200px] translate-y-[-50%] xl:w-[350px] "
            alt=""
          />
          <div className="absolute z-[0] -mt-5 flex min-w-[400px] justify-end">
            <input
              className="mr-2.5 h-11 min-h-[34px] w-full rounded-lg border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-950 placeholder:text-zinc-950 focus:outline-0 dark:border-zinc-800 dark:bg-transparent dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-400"
              placeholder="Type your OpenAI Key here..."
              onChange={handleInputApiKey}
            />
            <Button
              className="mt-auto flex h-full w-[200px] items-center justify-center rounded-lg px-4 py-2.5 text-base font-medium"
              onClick={handleApiKey}
            >
              Set API Key
            </Button>
          </div>
          <a
            className="absolute left-6 top-8 w-full text-center text-sm text-zinc-500 underline dark:text-zinc-400"
            target="_blank"
            href="https://platform.openai.com/account/api-keys"
          >
            Get your API key from Open AI Dashboard
          </a>
        </div>
        <div className="mx-auto flex min-h-[75vh] w-full max-w-[1000px] flex-col xl:min-h-[85vh]">
          {/* Model Change */}
          <div
            className={`flex w-full flex-col ${
              outputCode ? 'mb-5' : 'mb-auto'
            }`}
          >
            <div className="z-[2] mx-auto mb-5 flex w-max rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
              <div
                className={`flex cursor-pointer items-center justify-center py-2 transition-all duration-75 ${
                  model === 'gpt-4-1106-preview'
                    ? 'bg-white dark:bg-zinc-950'
                    : 'transparent'
                } h-[70xp] w-[174px] ${
                  model === 'gpt-4-1106-preview' ? '' : ''
                } rounded-lg text-base font-semibold text-zinc-950 dark:text-white`}
                onClick={() => setModel('gpt-4-1106-preview')}
              >
                GPT-4
              </div>
              <div
                className={`flex cursor-pointer items-center justify-center py-2 transition-colors duration-75 ${
                  model === 'gpt-4o'
                    ? 'bg-white dark:bg-zinc-950'
                    : 'transparent'
                } h-[70xp] w-[174px]
       ${
         model === 'gpt-4o' ? '' : ''
       } rounded-lg text-base font-semibold text-zinc-950 dark:text-white`}
                onClick={() => setModel('gpt-4o')}
              >
                GPT-4o
              </div>
            </div>
            <Accordion type="multiple" className="w-full">
              <AccordionItem
                className="z-10 mx-auto my-0 w-max min-w-[150px] border-0 text-zinc-950 dark:text-white"
                value="item-1"
              >
                <AccordionTrigger className="dark:text-white">
                  <div className="text-center">
                    <p className="text-sm font-medium text-zinc-950 dark:text-zinc-400">
                      No plugins added
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="dark:text-white">
                  <p className="text-center text-sm font-medium text-zinc-950 dark:text-zinc-400">
                    This is a cool text example.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          {/* Main Box */}
          <div
            className={`mx-auto flex w-full flex-col ${
              outputCode ? 'flex' : 'hidden'
            } mb-auto`}
          >
            <div className="mb-2.5 flex w-full items-center text-center">
              <div className="mr-5 flex h-[40px] min-h-[40px] min-w-[40px] items-center justify-center rounded-full border border-zinc-200 bg-transparent dark:border-transparent dark:bg-white">
                <HiUser className="h-4 w-4" />
              </div>
              <div className="flex w-full">
                <div className="me-2.5 flex w-full rounded-lg border border-zinc-200 bg-white/10 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950">
                  <p className="text-sm font-medium leading-6 text-zinc-950 dark:text-white md:text-base md:leading-[26px]">
                    {inputOnSubmit}
                  </p>
                </div>
                <div className="flex w-[70px] cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white/10 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950">
                  <HiMiniPencilSquare className="h-[20px] w-[20px] text-zinc-950 dark:text-white" />
                </div>
              </div>
            </div>
            <div className="flex w-full">
              <div className="mr-5 flex h-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-full bg-zinc-950 dark:border dark:border-zinc-800">
                <HiSparkles className="h-4 w-4 text-white" />
              </div>
              <MessageBoxChat output={outputCode} />
            </div>
          </div>
          {/* Chat Input */}
          <div className="mt-5 flex justify-end">
            <input
              className="mr-2.5 h-full min-h-[54px] w-full rounded-lg border border-zinc-200 bg-white px-5 py-5 text-sm font-medium text-zinc-950 placeholder:text-zinc-950 focus:outline-0 dark:border-zinc-800 dark:bg-transparent dark:text-white dark:placeholder:text-zinc-400"
              placeholder="Type your message here..."
              onChange={handleChange}
            />
            <Button
              className="mt-auto flex h-[unset] w-[200px] items-center justify-center rounded-lg px-4 py-5 text-base font-medium"
              onClick={handleTranslate}
            >
              Submit
            </Button>
          </div>

          <div className="mt-5 flex flex-col items-center justify-center md:flex-row">
            <p className="text-center text-xs text-zinc-500 dark:text-white">
              Free Research Preview. ChatGPT may produce inaccurate information
              about people, places, or facts. Consider checking important
              information.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
