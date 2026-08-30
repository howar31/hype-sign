import { RotateButton } from '../RotateButton';
import { FullscreenButton } from '../FullscreenButton';
import { LanguageToggle } from '../LanguageToggle';
import { MarginSlider } from '../MarginSlider';
import { useT } from '../../../lib/i18n';
import { useUpdateReady } from '../../../lib/swUpdate';

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.111.82-.261.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
    />
  </svg>
);

const KofiIcon = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.722s-.572 0-.665.667c-.092.668-.044 13.06-.044 13.06s.013 1.94 1.94 1.94h13.32c1.928 0 1.94-1.94 1.94-1.94v-1.43c.398.025.823.043 1.276.043 4.092 0 6.166-2.495 6.392-3.752.42-2.34-.6-3.995-1-3.995zm-7.05 7.95H4.46s-.667 0-.667-.667V8.282s0-.667.667-.667h12.37s.668 0 .668.667v7.95s0 .666-.668.666zm5.42-5.49c-.215.957-1.116 2.045-3.42 2.045V9.4c2.213 0 3.176.71 3.42 1.508.13.42.13.92 0 1.5z"
    />
    <path
      fill="currentColor"
      d="M11.394 9.86c-.728-.834-1.823-.834-2.45-.105-.626-.73-1.72-.73-2.45 0-.728.73-.728 2.06 0 2.79l2.45 2.45 2.45-2.45c.728-.73.728-2.06 0-2.685z"
    />
  </svg>
);

// Sponsor-page mark: heart outline, see ~/.claude/skills/accept-donations/references/sponsor-mark.md
const HeartIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width={16}
    height={16}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export function OtherSection() {
  const t = useT();
  const updateReady = useUpdateReady();
  const sponsor = t('version.sponsor');
  return (
    <>
      <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
        <RotateButton />
        <FullscreenButton />
      </div>
      <MarginSlider />
      <LanguageToggle />
      <div className="version-footer">
        <span className="version-line">
          {t('version.label')} {__COMMIT__}
          {updateReady ? ` · ${t('version.updateReady')}` : ''}
        </span>
        <div className="version-links">
          <a
            className="icon-link"
            data-brand="github"
            href="https://github.com/howar31/hype-sign"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('version.repo')}
            title={t('version.repo')}
          >
            <GitHubIcon />
          </a>
          <a
            className="icon-link"
            data-brand="page"
            href="https://donate.howar31.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${sponsor} · donate.howar31.com`}
            title={`${sponsor} · donate.howar31.com`}
          >
            <HeartIcon />
          </a>
          <a
            className="icon-link"
            data-brand="kofi"
            href="https://ko-fi.com/howar31"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ko-fi · ${sponsor}`}
            title={`Ko-fi · ${sponsor}`}
          >
            <KofiIcon />
          </a>
        </div>
      </div>
    </>
  );
}
