import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import axios, { AxiosError } from "axios";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Backend API base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

// Define supported languages (matching backend)
const languages = [
  { name: "English", code: "en" },
  { name: "Hindi", code: "hi" },
  { name: "Tamil", code: "ta" },
  { name: "Telugu", code: "te" },
  { name: "Bengali", code: "bn" },
  { name: "Marathi", code: "mr" },
  { name: "Gujarati", code: "gu" },
  { name: "Kannada", code: "kn" },
  { name: "Malayalam", code: "ml" },
  { name: "Spanish", code: "es" },
  { name: "French", code: "fr" },
];

// Form schema using Zod
const formSchema = z.object({
  schemeFile: z
    .instanceof(FileList)
    .refine((files) => files.length === 1, "Please upload one PDF file.")
    .refine(
      (files) => files[0]?.type === "application/pdf",
      "File must be a PDF."
    ),
  language: z.string().min(1, "Please select a language."),
});

// Type for form data
type FormData = z.infer<typeof formSchema>;

// Type for API response from /upload_scheme
interface UploadResponse {
  success: boolean;
  summary?: string;
  language?: string;
  language_code?: string;
  eligibility_questions?: string;
  original_eligibility_questions?: string;
  summary_title?: string;
  raw?: string;
  error?: string;
}

// Type for API response from /check_eligibility
interface EligibilityResponse {
  success: boolean;
  is_eligible: boolean;
  result: string;
  error?: string;
}

// Type for eligibility question answers
interface EligibilityAnswer {
  question: string;
  answer: "yes" | "no" | null;
}

export default function SchemeUploader() {
  const [summary, setSummary] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isEligibilityLoading, setIsEligibilityLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [eligibilityQuestions, setEligibilityQuestions] = useState<
    EligibilityAnswer[]
  >([]);
  const [eligibilityResult, setEligibilityResult] =
    useState<EligibilityResponse | null>(null);
  const [documentText, setDocumentText] = useState<string | null>(null);
  const [originalQuestions, setOriginalQuestions] = useState<string | null>(
    null
  );

  // Initialize React Hook Form with Shadcn/UI Form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      language: "en",
    },
  });

  const onSubmit = async (data: FormData) => {
    setSummary(null);
    setErrorMessage(null);
    setIsLoading(true);
    setAudioUrl(null);
    setEligibilityQuestions([]);
    setEligibilityResult(null);
    setDocumentText(null);
    setOriginalQuestions(null);

    try {
      // Prepare form data for upload
      console.log("Preparing to upload file:", data.schemeFile[0].name);
      const formData = new FormData();
      formData.append("scheme_file", data.schemeFile[0]);
      formData.append("language", data.language);

      // Upload the file and language
      const response = await axios.post<UploadResponse>(
        `${API_BASE_URL}/upload_scheme`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Upload response:", response.data);
      const responseData = response.data;

      // Store selected language
      setSelectedLanguage(data.language);

      if (responseData.success && responseData.summary) {
        setSummary(responseData.summary);
        // Process eligibility questions
        if (responseData.eligibility_questions) {
          const questions = responseData.eligibility_questions
            .split("\n")
            .filter((q) => q.trim())
            .map((question) => ({
              question,
              answer: null,
            }));
          setEligibilityQuestions(questions);
        }
        // Store document text and original questions
        setDocumentText(responseData.raw || null);
        setOriginalQuestions(
          responseData.original_eligibility_questions || null
        );
      } else {
        setErrorMessage(
          responseData.error || "No summary returned from server."
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      if (axios.isAxiosError(error)) {
        if (error.code === "ERR_NETWORK") {
          setErrorMessage(
            `Cannot connect to the server. Please ensure the backend is running at ${API_BASE_URL}.`
          );
        } else {
          setErrorMessage(
            (error.response?.data as any)?.error ||
              "Failed to upload scheme. Please try again."
          );
        }
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle audio generation
  const handleGenerateAudio = async () => {
    if (!summary) {
      setErrorMessage("No summary available to generate audio.");
      setAudioUrl(null);
      return;
    }

    setErrorMessage(null);
    setAudioUrl(null);
    setIsAudioLoading(true);

    try {
      console.log(
        "Generating audio for summary:",
        summary.substring(0, 50) + "..."
      );
      const res = await axios.post(
        `${API_BASE_URL}/generate_audio`,
        {
          summary,
          language: selectedLanguage,
        },
        {
          responseType: "blob", // get binary data
        }
      );

      const blob = new Blob([res.data], { type: "audio/mp3" });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      console.log("Audio URL generated:", url);
    } catch (error) {
      console.error("Audio generation error:", error);
      if (axios.isAxiosError(error)) {
        if (error.code === "ERR_NETWORK") {
          setErrorMessage(
            `Cannot connect to the server. Please ensure the backend is running at ${API_BASE_URL}.`
          );
        } else {
          setErrorMessage(
            (error.response?.data as any)?.error ||
              "Failed to generate audio. Please try again."
          );
        }
      } else {
        setErrorMessage("An unexpected error occurred while generating audio.");
      }
    } finally {
      setIsAudioLoading(false);
    }
  };

  // Handle eligibility question answer changes
  const handleAnswerChange = (index: number, answer: "yes" | "no") => {
    setEligibilityQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, answer } : q))
    );
  };

  // Handle eligibility check
  const handleCheckEligibility = async () => {
    if (eligibilityQuestions.some((q) => q.answer === null)) {
      setErrorMessage("Please answer all eligibility questions.");
      return;
    }

    if (!documentText || !originalQuestions) {
      setErrorMessage(
        "Scheme data is missing. Please upload the scheme again."
      );
      return;
    }

    setErrorMessage(null);
    setIsEligibilityLoading(true);
    setEligibilityResult(null);

    try {
      // Prepare form data for /check_eligibility
      const formData = new FormData();
      eligibilityQuestions.forEach((q, index) => {
        formData.append(`q${index}`, q.answer === "yes" ? "Yes" : "No");
      });
      formData.append("document_text", documentText);
      formData.append("original_questions", originalQuestions);
      formData.append("language", selectedLanguage);

      const response = await axios.post<EligibilityResponse>(
        `${API_BASE_URL}/check_eligibility`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Eligibility check response:", response.data);
      setEligibilityResult(response.data);
    } catch (error) {
      console.error("Eligibility check error:", error);
      if (axios.isAxiosError(error)) {
        if (error.code === "ERR_NETWORK") {
          setErrorMessage(
            `Cannot connect to the server. Please ensure the backend is running at ${API_BASE_URL}.`
          );
        } else {
          setErrorMessage(
            (error.response?.data as any)?.error ||
              "Failed to check eligibility. Please try again."
          );
        }
      } else {
        setErrorMessage(
          "An unexpected error occurred while checking eligibility."
        );
      }
    } finally {
      setIsEligibilityLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">
        Upload Government Scheme
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Language Selector */}
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* File Input */}
          <FormField
            control={form.control}
            name="schemeFile"
            render={({ field: { onChange, value, ...rest } }) => (
              <FormItem>
                <FormLabel>Upload PDF</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files) {
                        onChange(e.target.files);
                      }
                    }}
                    {...rest}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Scheme"
            )}
          </Button>
        </form>
      </Form>

      {/* Error Message */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Summary and Eligibility Sections */}
      {summary && (
        <div className="p-4 bg-gray-50 rounded-lg border space-y-6">
          {/* Summary Section */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Scheme Summary</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
          </div>

          {/* Audio Section */}
          <div>
            <Button
              onClick={handleGenerateAudio}
              disabled={isAudioLoading}
              className="w-full"
            >
              {isAudioLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Audio...
                </>
              ) : (
                "Generate Audio"
              )}
            </Button>
            {audioUrl && (
              <div className="mt-2">
                <audio controls src={audioUrl} className="w-full">
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
          {/* Eligibility Questions Section */}
          {eligibilityQuestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-md font-semibold">Eligibility Questions</h3>
              {eligibilityQuestions.map((item, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-gray-700">{item.question}</p>
                  <RadioGroup
                    onValueChange={(value: "yes" | "no") =>
                      handleAnswerChange(index, value)
                    }
                    value={item.answer || undefined}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id={`yes-${index}`} />
                      <label htmlFor={`yes-${index}`}>Yes</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id={`no-${index}`} />
                      <label htmlFor={`no-${index}`}>No</label>
                    </div>
                  </RadioGroup>
                </div>
              ))}
              <Button
                onClick={handleCheckEligibility}
                disabled={isEligibilityLoading}
                className="w-full"
              >
                {isEligibilityLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking Eligibility...
                  </>
                ) : (
                  "Check Eligibility"
                )}
              </Button>
            </div>
          )}

          {/* Eligibility Result Section */}
          {eligibilityResult && (
            <div className="space-y-2">
              <h3 className="text-md font-semibold">Eligibility Result</h3>
              <Alert
                variant={
                  eligibilityResult.is_eligible ? "default" : "destructive"
                }
              >
                <AlertTitle>
                  {eligibilityResult.is_eligible ? "Eligible" : "Not Eligible"}
                </AlertTitle>
                <AlertDescription className="whitespace-pre-wrap">
                  {eligibilityResult.result}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
