//
// Copyright 2023 DXOS.org
//

import React, { useState } from 'react';
import { Outlet, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Document } from '@braneframe/types';
import {
  Button,
  useTranslation,
  MainRoot,
  Main,
  Sidebar,
  MainOverlay,
  ToastRoot,
  ToastTitle,
  ToastBody,
  ToastAction,
  ToastActions,
} from '@dxos/aurora';
import { defaultOsButtonColors } from '@dxos/aurora-theme';
import { CancellableInvitationObservable, Invitation, PublicKey, ShellLayout } from '@dxos/client';
import { useTelemetry } from '@dxos/react-appkit';
import { SpaceState, useIdentity, useInvitationStatus, useSpaceInvitations, useSpaces } from '@dxos/react-client';
import { ShellProvider, useShell } from '@dxos/react-shell';

import { SidebarContent, SidebarToggle, OctokitProvider } from '../components';
import { namespace, abbreviateKey, getPath } from '../router';
import type { OutletContext } from './OutletContext';
import { EditorViewState } from './OutletContext';

const InvitationToast = ({
  invitation,
  spaceKey,
}: {
  invitation: CancellableInvitationObservable;
  spaceKey: PublicKey;
}) => {
  const { status } = useInvitationStatus(invitation);
  const shell = useShell();
  const { t } = useTranslation('composer');
  const handleViewInvitations = async () => shell.setLayout(ShellLayout.SPACE_INVITATIONS, { spaceKey });
  return status === Invitation.State.READY_FOR_AUTHENTICATION ? (
    <ToastRoot defaultOpen>
      <ToastBody>
        <ToastTitle>{t('invitation ready for auth code message')}</ToastTitle>
      </ToastBody>
      <ToastActions>
        <ToastAction altText='View' asChild>
          <Button onClick={handleViewInvitations}>{t('view invitations label')}</Button>
        </ToastAction>
      </ToastActions>
    </ToastRoot>
  ) : null;
};

export const StandaloneLayout = () => {
  // TODO(wittjosiah): Settings to disable telemetry, sync from HALO?
  useTelemetry({ namespace });
  useIdentity({ login: true });

  const { spaceKey, docKey } = useParams();
  const allSpaces = useSpaces({ all: true });
  const space = allSpaces.find(
    (space) => abbreviateKey(space.key) === spaceKey && space.state.get() === SpaceState.READY,
  );
  const document = space && docKey ? (space.db.getObjectById(docKey) as Document) : undefined;
  const invitations = useSpaceInvitations(space?.key);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const spaceInvitationCode = searchParams.get('spaceInvitationCode');
  const haloInvitationCode = searchParams.get('haloInvitationCode');

  const [editorViewState, setEditorViewState] = useState<EditorViewState>('editor');

  return (
    <ShellProvider
      space={space}
      spaceInvitationCode={spaceInvitationCode}
      haloInvitationCode={haloInvitationCode}
      onJoinedSpace={(nextSpaceKey) => {
        navigate(getPath(nextSpaceKey));
      }}
    >
      {/* TODO(burdon): Probably shouldn't introduce Octokit dep this high up. */}
      <OctokitProvider>
        <MainRoot>
          <MainOverlay />
          <Sidebar swipeToDismiss classNames={[defaultOsButtonColors, 'backdrop-blur overflow-visible']}>
            <SidebarContent />
          </Sidebar>
          <Main classNames='min-bs-full'>
            <SidebarToggle />
            <Outlet
              context={{ space, document, layout: 'standalone', editorViewState, setEditorViewState } as OutletContext}
            />
          </Main>
        </MainRoot>
      </OctokitProvider>
      {space &&
        invitations.map((invitation) => {
          return <InvitationToast invitation={invitation} spaceKey={space.key} key={invitation.get().invitationId} />;
        })}
    </ShellProvider>
  );
};