import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { CardWrapper} from "./card-wrapper";
export const ErrorCard = () => {
    return (
        <CardWrapper
            headerLabel="Oops! Something went wrong!"
            backButtonHref="/auth/login"
            backButtonLabel="back to login"
            >
                <div className="w-ful flex justify-center items-center">
                    <ExclamationTriangleIcon className="text-destructive"/>
                </div>
        </CardWrapper>
    );
};