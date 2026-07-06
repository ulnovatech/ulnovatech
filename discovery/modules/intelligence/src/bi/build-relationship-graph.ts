import type {
  BiGraphEdge,
  BiGraphNode,
  BiLinkInBioPage,
  BiRelationshipGraph,
  BusinessIntelligenceProfile,
} from './types';

function nodeId(prefix: string, key: string): string {
  return `${prefix}:${key.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80)}`;
}

export function buildRelationshipGraph(input: {
  profile: Pick<
    BusinessIntelligenceProfile,
    'accountId' | 'identity' | 'contact' | 'presence' | 'digitalFootprint'
  >;
  linkInBioPages?: BiLinkInBioPage[];
}): BiRelationshipGraph {
  const nodes: BiGraphNode[] = [];
  const edges: BiGraphEdge[] = [];
  const nodeKeys = new Set<string>();

  const addNode = (node: BiGraphNode) => {
    if (nodeKeys.has(node.id)) return;
    nodeKeys.add(node.id);
    nodes.push(node);
  };

  const addEdge = (edge: BiGraphEdge) => {
    edges.push(edge);
  };

  const rootId = nodeId('account', input.profile.accountId);
  addNode({
    id: rootId,
    type: 'business',
    label: input.profile.identity.name,
  });

  if (input.profile.contact.website) {
    const websiteId = nodeId('website', input.profile.contact.website);
    addNode({
      id: websiteId,
      type: 'website',
      label: 'Website',
      url: input.profile.contact.website,
    });
    addEdge({
      from: rootId,
      to: websiteId,
      relation: 'owns',
      source: 'account',
    });
  }

  if (input.profile.presence.googleMapsUrl) {
    const mapsId = nodeId('maps', input.profile.presence.googleMapsUrl);
    addNode({
      id: mapsId,
      type: 'google_maps',
      label: 'Google Maps',
      url: input.profile.presence.googleMapsUrl,
    });
    addEdge({
      from: rootId,
      to: mapsId,
      relation: 'listed_on',
      source: 'account',
    });
  }

  for (const link of input.profile.digitalFootprint.socialLinks) {
    const socialId = nodeId('social', `${link.platform}:${link.url}`);
    addNode({
      id: socialId,
      type: 'social',
      label: link.platform,
      url: link.url,
      platform: link.platform,
    });
    addEdge({
      from: rootId,
      to: socialId,
      relation: 'has_profile',
      source: link.discoveredVia,
    });

    if (input.profile.contact.website) {
      const websiteId = nodeId('website', input.profile.contact.website);
      if (link.discoveredVia === 'crawl' || link.discoveredVia === 'link_in_bio') {
        addEdge({
          from: websiteId,
          to: socialId,
          relation: 'links_to',
          source: link.discoveredVia,
        });
      }
    }
  }

  for (const page of input.linkInBioPages ?? []) {
    const libId = nodeId('link_in_bio', page.url);
    addNode({
      id: libId,
      type: 'link_in_bio',
      label: 'Link in bio',
      url: page.url,
    });
    addEdge({
      from: rootId,
      to: libId,
      relation: 'uses',
      source: 'crawl',
    });

    if (page.resolvedWebsite) {
      const resolvedWebId = nodeId('website', page.resolvedWebsite);
      addNode({
        id: resolvedWebId,
        type: 'website',
        label: 'Website (from bio page)',
        url: page.resolvedWebsite,
      });
      addEdge({
        from: libId,
        to: resolvedWebId,
        relation: 'resolves_to',
        source: 'link_in_bio_resolver',
      });
    }

    for (const outbound of page.outboundLinks) {
      const socialId = nodeId('social', `${outbound.platform}:${outbound.url}`);
      if (!nodeKeys.has(socialId)) {
        addNode({
          id: socialId,
          type: 'social',
          label: outbound.platform,
          url: outbound.url,
          platform: outbound.platform,
        });
      }
      addEdge({
        from: libId,
        to: socialId,
        relation: 'resolves_to',
        source: 'link_in_bio_resolver',
      });
    }
  }

  return { nodes, edges };
}

export function graphSummary(graph: BiRelationshipGraph): {
  nodeCount: number;
  socialCount: number;
  linkInBioCount: number;
} {
  return {
    nodeCount: graph.nodes.length,
    socialCount: graph.nodes.filter((n) => n.type === 'social').length,
    linkInBioCount: graph.nodes.filter((n) => n.type === 'link_in_bio').length,
  };
}
